import type { Board, BoardWithColumn, UpdateBoard } from '../types'
import { eq } from 'drizzle-orm'
import { isNotNil, pickBy } from 'es-toolkit'
import { db } from '..'
import { redis } from '../../cache'
import { getActiveOrganizationId, getDefaultColumns } from '../helpers'
import { board, boardColumn } from '../schema'

// Cache TTL constants (in seconds)
const BOARD_LIST_CACHE_TTL = 900 // 15 minutes
const BOARD_CACHE_TTL = 1800 // 30 minutes
const INVALIDATION_SET_TTL = 86400 // 24 hours

/**
 * Helper function to invalidate board caches
 * @param organizationId The organization ID
 * @param userId Optional user ID for targeted invalidation
 * @param boardId Optional board ID for targeted invalidation
 */
async function invalidateBoardCaches(organizationId: string, userId?: string, boardId?: string) {
  try {
    const pipeline = redis.pipeline()

    if (boardId && userId) {
      // Invalidate specific board cache
      pipeline.del(`boards:${organizationId}:${userId}:board:${boardId}`)
    }

    if (userId) {
      // Invalidate user's board lists
      pipeline.del(`boards:${organizationId}:${userId}:all:false`)
      pipeline.del(`boards:${organizationId}:${userId}:all:true`)
    }
    else {
      // Invalidate all board lists for the organization
      const invalidationSet = `boards:${organizationId}:invalidation_set`
      const keysToInvalidate = await redis.smembers<string[]>(invalidationSet)

      if (keysToInvalidate && keysToInvalidate.length > 0) {
        for (const key of keysToInvalidate) {
          pipeline.del(key)
        }
        pipeline.del(invalidationSet)
      }
    }

    await pipeline.exec()
  }
  catch {}
}

export const boardQueries = {
  async createWithDefaultColumns(
    userId: string,
    boardData: Omit<Board, 'id' | 'userId' | 'organizationId' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
  ): Promise<undefined | BoardWithColumn> {
    try {
      const activeOrgId = await getActiveOrganizationId(userId)
      if (!activeOrgId)
        return undefined

      const [newBoard] = await db
        .insert(board)
        .values({
          ...(pickBy(boardData, isNotNil) as Board),
          userId,
          organizationId: activeOrgId,
          isDeleted: false,
        })
        .returning()

      if (!newBoard)
        return undefined

      const newColumns = await db
        .insert(boardColumn)
        .values(getDefaultColumns(newBoard.id))
        .returning()

      // Invalidate user's board list cache
      await invalidateBoardCaches(activeOrgId, userId)

      return { ...newBoard, columns: newColumns }
    }
    catch (error) {
      console.error('ERROR: while `create` in boards.\n', error)
      return undefined
    }
  },
  async create(
    userId: string,
    boardData: Omit<Board, 'id' | 'userId' | 'organizationId' | 'isDeleted' | 'createdAt' | 'updatedAt'>,
  ): Promise<undefined | Board> {
    try {
      const activeOrgId = await getActiveOrganizationId(userId)
      if (!activeOrgId)
        return undefined

      const [newBoard] = await db
        .insert(board)
        .values({
          ...(pickBy(boardData, isNotNil) as Board),
          userId,
          organizationId: activeOrgId,
          isDeleted: false,
        })
        .returning()

      // Invalidate user's board list cache
      await invalidateBoardCaches(activeOrgId, userId)

      return newBoard
    }
    catch (error) {
      console.error('ERROR: while `create` in boards.\n', error)
      return undefined
    }
  },
  async getAll(userId: string, onlyDeleted = false): Promise<undefined | Board[]> {
    try {
      const activeOrgId = await getActiveOrganizationId(userId)
      if (!activeOrgId)
        return undefined

      // Try to get from cache first
      const cacheKey = `boards:${activeOrgId}:${userId}:all:${onlyDeleted}`
      try {
        const cached = await redis.get<Board[]>(cacheKey)
        if (cached) {
          return cached
        }
      }
      catch {}

      // Get from database
      const boards = await db.query.board.findMany({
        where: ({ organizationId, isDeleted }, { eq, and }) =>
          and(
            eq(organizationId, activeOrgId),
            eq(isDeleted, onlyDeleted),
          ),
        orderBy: (_, { desc }) => desc(board.updatedAt),
      })

      if (boards) {
        try {
          await redis.set(cacheKey, boards, { ex: BOARD_LIST_CACHE_TTL })
          await redis.sadd(`boards:${activeOrgId}:invalidation_set`, cacheKey)
          await redis.expire(`boards:${activeOrgId}:invalidation_set`, INVALIDATION_SET_TTL)
        }
        catch {}
      }

      return boards
    }
    catch (error) {
      console.error('ERROR: while `getAll` in boards.\n', error)
      return undefined
    }
  },
  async getWithColumnsAndTasksById(userId: string, boardId: string, onlyDeleted = false) {
    try {
      const activeOrgId = await getActiveOrganizationId(userId)
      if (!activeOrgId)
        return undefined

      // Try to get from cache first
      const cacheKey = `boards:${activeOrgId}:${userId}:board:${boardId}`
      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          return cached
        }
      }
      catch {}

      // Get from database
      const board = await db.query.board.findFirst({
        where: (b, op) =>
          op.and(
            op.eq(b.id, boardId),
            op.or(
              op.eq(b.userId, userId),
              op.eq(b.organizationId, activeOrgId),
            ),
            op.eq(b.isDeleted, onlyDeleted),
          ),
        with: {
          columns: {
            orderBy: (bc, { asc }) => asc(bc.sort_order),
            with: {
              tasks: {
                orderBy: (t, { asc }) => asc(t.sort_order),
                with: {
                  assigneeUser: {
                    columns: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                  ownerUser: {
                    columns: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      // Cache the result if successful
      if (board) {
        try {
          await redis.set(cacheKey, board, { ex: BOARD_CACHE_TTL })
          await redis.sadd(`boards:${activeOrgId}:invalidation_set`, cacheKey)
          await redis.expire(`boards:${activeOrgId}:invalidation_set`, INVALIDATION_SET_TTL)
        }
        catch {}
      }

      return board
    }
    catch (error) {
      console.error('ERROR: while `getById` in boards.\n', error)
      return undefined
    }
  },
  async unDeleteById(userId: string, boardId: string): Promise<undefined | Board> {
    try {
      const activeOrgId = await getActiveOrganizationId(userId)
      if (!activeOrgId)
        return undefined

      const foundBoard = await db.query.board.findFirst({
        where: (b, op) =>
          op.and(
            op.eq(b.userId, userId),
            op.eq(b.id, boardId),
            op.eq(b.organizationId, activeOrgId),
            op.eq(b.isDeleted, true),
          ),
      })

      if (!foundBoard)
        return undefined

      const [updatedBoard] = await db
        .update(board)
        .set({
          isDeleted: false,
        })
        .where(eq(board.id, foundBoard.id))
        .returning()

      // Invalidate caches
      await invalidateBoardCaches(activeOrgId, userId, boardId)

      return updatedBoard
    }
    catch (error) {
      console.error('ERROR: while `unDeleteById` in boards.\n', error)
      return undefined
    }
  },
  async deleteById(userId: string, boardId: string): Promise<undefined | Board> {
    try {
      const activeOrgId = await getActiveOrganizationId(userId)
      if (!activeOrgId)
        return undefined

      const foundBoard = await db.query.board.findFirst({
        where: ({ userId: dbUserId, id, organizationId, isDeleted }, { eq, and }) =>
          and(eq(dbUserId, userId), eq(id, boardId), eq(organizationId, activeOrgId), eq(isDeleted, false)),
      })

      if (!foundBoard)
        return undefined

      const [updatedBoard] = await db
        .update(board)
        .set({
          isDeleted: true,
        })
        .where(eq(board.id, foundBoard.id))
        .returning()

      // Invalidate caches
      await invalidateBoardCaches(activeOrgId, userId, boardId)

      return updatedBoard
    }
    catch (error) {
      console.error('ERROR: while `deleteById` in boards.\n', error)
      return undefined
    }
  },
  async updateById(userId: string, boardObj: UpdateBoard): Promise<undefined | Board> {
    try {
      const activeOrgId = await getActiveOrganizationId(userId)
      if (!activeOrgId)
        return undefined

      const updatedBoardObj = pickBy(boardObj, isNotNil)
      const foundBoard = await db.query.board.findFirst({
        where: ({ userId: dbUserId, id, organizationId, isDeleted }, { eq, and }) =>
          and(eq(dbUserId, userId), eq(id, boardObj.id), eq(organizationId, activeOrgId), eq(isDeleted, false)),
      })
      if (!foundBoard)
        return undefined

      const [updatedBoard] = await db
        .update(board)
        .set(updatedBoardObj)
        .where(eq(board.id, foundBoard.id))
        .returning()

      // Invalidate caches
      await invalidateBoardCaches(activeOrgId, userId, boardObj.id)

      return updatedBoard
    }
    catch (error) {
      console.error('ERROR: while `updateById` in boards.\n', error)
      return undefined
    }
  },

  /**
   * Permanently delete a board that is already soft-deleted.
   * Ensures the board belongs to the user and is marked as deleted before hard-deleting.
   * Cascades will remove dependent rows (columns/tasks) via FK onDelete: 'cascade'.
   */
  async deletePermanentlyById(userId: string, boardId: string): Promise<boolean> {
    try {
      const activeOrgId = await getActiveOrganizationId(userId)
      if (!activeOrgId)
        return false

      const foundBoard = await db.query.board.findFirst({
        where: ({ userId: dbUserId, id, organizationId, isDeleted }, { eq, and }) =>
          and(eq(dbUserId, userId), eq(id, boardId), eq(organizationId, activeOrgId), eq(isDeleted, true)),
      })

      if (!foundBoard)
        return false

      const [deleted] = await db
        .delete(board)
        .where(eq(board.id, foundBoard.id))
        .returning()

      // Invalidate caches
      await invalidateBoardCaches(activeOrgId, userId, boardId)

      return !!deleted
    }
    catch (error) {
      console.error('ERROR: while `deletePermanentlyById` in boards.\n', error)
      return false
    }
  },
} as const
