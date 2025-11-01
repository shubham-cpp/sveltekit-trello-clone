import type { MoveTaskColumnSchema, UpdateTaskSortOrderSchema } from '$lib/zod-schemas'
import type { BoardTask, UpdateTask } from '../types'
import { getActiveOrganizationId } from '$db/helpers'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { isNotNil, pickBy } from 'es-toolkit'
import { db } from '..'
import { board, task } from '../schema'

export const taskQueries = {
  async getAll(
    userId: string,
    boardId: string,
    columnId?: string,
  ): Promise<undefined | BoardTask[]> {
    try {
      const foundBoard = await db.query.board.findFirst({
        where: ({ userId: dbUserId, id, isDeleted }, { eq, and }) =>
          and(eq(dbUserId, userId), eq(id, boardId), eq(isDeleted, false)),
      })

      if (!foundBoard)
        return undefined

      if (columnId) {
        return await db.query.task.findMany({
          where: ({ boardId: taskBoardId, boardColumnId }, { eq, and }) =>
            and(eq(taskBoardId, boardId), eq(boardColumnId, columnId)),
          orderBy: ({ sort_order }, { asc }) => asc(sort_order),
        })
      }
      else {
        return await db.query.task.findMany({
          where: ({ boardId: taskBoardId }, { eq }) => eq(taskBoardId, boardId),
          orderBy: ({ sort_order }, { asc }) => asc(sort_order),
        })
      }
    }
    catch (error) {
      console.error('ERROR: while `getAll` in tasks.\n', error)
      return undefined
    }
  },
  async getById(userId: string, taskId: string): Promise<undefined | BoardTask> {
    try {
      // Get the task and join with board to check ownership
      const result = await db
        .select()
        .from(task)
        .innerJoin(board, eq(task.boardId, board.id))
        .where(and(eq(task.id, taskId), eq(board.userId, userId), eq(board.isDeleted, false)))
        .get()

      if (!result)
        return undefined

      return result.task
    }
    catch (error) {
      console.error('ERROR: while `getById` in tasks.\n', error)
      return undefined
    }
  },
  async create(
    userId: string,
    boardId: string,
    columnId: string,
    taskData: Omit<
      BoardTask,
'id' | 'boardId' | 'boardColumnId' | 'owner' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<undefined | BoardTask> {
    try {
      const activeOrganizationId = await getActiveOrganizationId(userId)
      if (!activeOrganizationId)
        return undefined

      // First check if the user owns the board
      const foundBoard = await db.query.board.findFirst({
        where: ({ organizationId, id, isDeleted }, { eq, and }) =>
          and(
            eq(id, boardId),
            eq(organizationId, activeOrganizationId),
            eq(isDeleted, false),
          ),
      })

      if (!foundBoard)
        return undefined

      // Then check if the column exists and belongs to the board
      const foundColumn = await db.query.boardColumn.findFirst({
        where: ({ id, boardId: columnBoardId }, { eq, and }) =>
          and(eq(id, columnId), eq(columnBoardId, boardId)),
      })

      if (!foundColumn)
        return undefined

      return await db.transaction(async (tx) => {
        const sameColumn = eq(task.boardColumnId, foundColumn.id)
        const totalRows = await tx.select().from(task).where(sameColumn)
        const { rowsAffected } = await tx.update(task).set({ sort_order: sql`${task.sort_order} + 1` }).where(sameColumn)
        if (rowsAffected !== totalRows.length)
          return undefined
        // Then create the task
        const [newTask] = await tx
          .insert(task)
          .values({
            ...taskData,
            boardId,
            boardColumnId: columnId,
            owner: userId,
          })
          .returning()
        return newTask
      })
    }
    catch (error) {
      console.error('ERROR: while `create` in tasks.\n', error)
      return undefined
    }
  },
  async updateById(userId: string, taskObj: UpdateTask): Promise<undefined | BoardTask> {
    try {
      const updatedTaskObj = pickBy(taskObj, isNotNil)

      // Get the task and join with board to check ownership
      const result = await db
        .select()
        .from(task)
        .innerJoin(board, eq(task.boardId, board.id))
        .where(and(eq(task.id, taskObj.id), eq(board.userId, userId), eq(board.isDeleted, false)))
        .get()

      if (!result)
        return undefined

      // Update the task
      const [updatedTask] = await db
        .update(task)
        .set(updatedTaskObj)
        .where(eq(task.id, taskObj.id))
        .returning()

      return updatedTask
    }
    catch (error) {
      console.error('ERROR: while `updateById` in tasks.\n', error)
      return undefined
    }
  },
  async deleteById(userId: string, taskId: string): Promise<undefined | BoardTask> {
    try {
      // Get the task and join with board to check ownership
      const result = await db
        .select()
        .from(task)
        .innerJoin(board, eq(task.boardId, board.id))
        .where(and(eq(task.id, taskId), eq(board.userId, userId), eq(board.isDeleted, false)))
        .get()

      if (!result)
        return undefined

      // Delete the task
      const [deletedTask] = await db.delete(task).where(eq(task.id, taskId)).returning()

      return deletedTask
    }
    catch (error) {
      console.error('ERROR: while `deleteById` in tasks.\n', error)
      return undefined
    }
  },
  async moveToColumn(
    userId: string,
    boardId: string,
    newColumnId: string,
    taskId: string,
    newSortOrder: MoveTaskColumnSchema['newSortOrder'],
  ): Promise<boolean> {
    try {
      const activeOrganizationId = await getActiveOrganizationId(userId)
      if (!activeOrganizationId)
        return false

      const res = await db.transaction(async (tx) => {
        const found = await tx.query.board.findFirst({
          where: (b, op) => op.and(
            op.eq(b.id, boardId),
            op.eq(b.organizationId, activeOrganizationId),
            op.eq(b.isDeleted, false),
          ),
          with: {
            columns: {
              where: (bc, op) => op.eq(bc.id, newColumnId),
            },
          },
        })
        if (!found)
          return false

        if (newSortOrder.length <= 1) {
          const [hasUpdated] = await tx
            .update(task)
            .set({ boardColumnId: newColumnId, sort_order: 0 })
            .where(eq(task.id, taskId))
            .returning()
          return !!hasUpdated
        }

        const movedIdx = newSortOrder.findIndex(i => i.id === taskId)
        if (movedIdx < 0)
          return false

        await tx
          .update(task)
          .set({ boardColumnId: newColumnId, sort_order: movedIdx })
          .where(eq(task.id, taskId))

        const ids = newSortOrder.map(item => item.id)
        const caseSql = sql`
      (case
        ${sql.join(
          newSortOrder.map(item =>
            sql`when ${task.id} = ${item.id} then ${item.newIndex}`,
          ),
          sql` `,
        )}
      end)
    `
        const updatedData = await tx
          .update(task)
          .set({ sort_order: caseSql })
          .where(and(
            eq(task.boardColumnId, newColumnId),
            inArray(task.id, ids),
          ))
        return !!updatedData
      })
      return !!res
    }
    catch (error) {
      console.error('ERROR: while `moveToColumn` in tasks.\n', error)
      return false
    }
  },
  async updateSortOrder(userId: string, boardId: string, columnId: string, newSortOrder: UpdateTaskSortOrderSchema['newSortOrder']) {
    if (newSortOrder.length === 0)
      return undefined
    try {
      const activeOrganizationId = await getActiveOrganizationId(userId)
      if (!activeOrganizationId)
        return undefined

      const res = await db.transaction(async (tx) => {
        const found = await tx.query.board.findFirst({
          where: (b, op) => op.and(
            op.eq(b.id, boardId),
            op.eq(b.organizationId, activeOrganizationId),
            op.eq(b.isDeleted, false),
          ),
          with: {
            columns: {
              where: (bc, op) => op.eq(bc.id, columnId),
            },
          },
        })
        if (!found)
          return undefined

        const ids = newSortOrder.map(r => r.id)
        const caseSql = sql`
      (case
        ${sql.join(
          newSortOrder.map(r => sql`when ${task.id} = ${r.id} then ${r.newIndex}`),
          sql` `,
        )}
       end)
    `

        return await tx
          .update(task)
          .set({ sort_order: caseSql })
          .where(and(eq(task.boardColumnId, columnId), inArray(task.id, ids),
          ))
          .returning()
      })
      if (!Array.isArray(res) || res.length === 0)
        return undefined
      return true
    }
    catch (error) {
      console.error('ERROR: while `updateSortOrder` in tasks.\n', error)
      return undefined
    }
  },
} as const
