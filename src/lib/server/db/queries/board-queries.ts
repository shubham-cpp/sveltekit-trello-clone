import type { Board, BoardWithColumn, UpdateBoard } from '../types'
import { eq } from 'drizzle-orm'
import { isNotNil, pickBy } from 'es-toolkit'
import { db } from '..'
import { getActiveOrganizationId, getDefaultColumns } from '../helpers'
import { board, boardColumn } from '../schema'

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

      return await db.query.board.findMany({
        where: ({ userId: dbUserId, organizationId, isDeleted }, { eq, and, or }) =>
          and(
            or(eq(dbUserId, userId), eq(organizationId, activeOrgId)),
            eq(isDeleted, onlyDeleted),
          ),
        orderBy: (_, { desc }) => desc(board.updatedAt),
      })
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

      return await db.query.board.findFirst({
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

      return !!deleted
    }
    catch (error) {
      console.error('ERROR: while `deletePermanentlyById` in boards.\n', error)
      return false
    }
  },
} as const
