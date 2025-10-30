import type { BoardColumn, UpdateBoardColumn } from '../types'
import { and, eq } from 'drizzle-orm'
import { isNotNil, pickBy } from 'es-toolkit'
import { db } from '..'
import { board, boardColumn } from '../schema'

export const boardColumnQueries = {
  async getAll(userId: string, boardId: string) {
    try {
      const foundBoard = await db.query.board.findFirst({
        where: ({ userId: dbUserId, id, isDeleted }, { eq, and }) =>
          and(eq(dbUserId, userId), eq(id, boardId), eq(isDeleted, false)),
        with: {
          columns: {
            orderBy: ({ sort_order }, { asc }) => asc(sort_order),
          },
        },
      })

      return foundBoard
    }
    catch (error) {
      console.error('ERROR: while `getAll` in boardColumns.\n', error)
      return undefined
    }
  },
  async getById(userId: string, columnId: string): Promise<undefined | BoardColumn> {
    try {
      const result = await db
        .select()
        .from(boardColumn)
        .innerJoin(board, eq(boardColumn.boardId, board.id))
        .where(
          and(
            eq(boardColumn.id, columnId),
            eq(board.userId, userId),
            eq(board.isDeleted, false),
          ),
        )
        .get()

      if (!result)
        return undefined

      return result.board_column
    }
    catch (error) {
      console.error('ERROR: while `getById` in boardColumns.\n', error)
      return undefined
    }
  },
  async create(
    userId: string,
    boardId: string,
    columnData: Omit<BoardColumn, 'id' | 'boardId' | 'createdAt' | 'updatedAt'>,
  ): Promise<undefined | BoardColumn> {
    try {
      const foundBoard = await db.query.board.findFirst({
        where: ({ userId: dbUserId, id, isDeleted }, { eq, and }) =>
          and(eq(dbUserId, userId), eq(id, boardId), eq(isDeleted, false)),
      })

      if (!foundBoard)
        return undefined

      // Then create the column
      const [newColumn] = await db
        .insert(boardColumn)
        .values({
          ...columnData,
          boardId,
        })
        .returning()

      return newColumn
    }
    catch (error) {
      console.error('ERROR: while `create` in boardColumns.\n', error)
      return undefined
    }
  },
  async updateById(userId: string, columnObj: UpdateBoardColumn): Promise<undefined | BoardColumn> {
    try {
      const updatedColumnObj = pickBy(columnObj, isNotNil)

      const result = await db
        .select()
        .from(boardColumn)
        .innerJoin(board, eq(boardColumn.boardId, board.id))
        .where(
          and(
            eq(boardColumn.id, columnObj.id),
            eq(board.userId, userId),
            eq(board.isDeleted, false),
          ),
        )
        .get()

      if (!result)
        return undefined

      // Update the column
      const [updatedColumn] = await db
        .update(boardColumn)
        .set(updatedColumnObj)
        .where(eq(boardColumn.id, columnObj.id))
        .returning()

      return updatedColumn
    }
    catch (error) {
      console.error('ERROR: while `updateById` in boardColumns.\n', error)
      return undefined
    }
  },
  async deleteById(userId: string, columnId: string): Promise<undefined | BoardColumn> {
    try {
      const result = await db
        .select()
        .from(boardColumn)
        .innerJoin(board, eq(boardColumn.boardId, board.id))
        .where(
          and(eq(boardColumn.id, columnId), eq(board.userId, userId), eq(board.isDeleted, false)),
        )
        .get()

      if (!result)
        return undefined

      const [deletedColumn] = await db
        .delete(boardColumn)
        .where(eq(boardColumn.id, columnId))
        .returning()

      return deletedColumn
    }
    catch (error) {
      console.error('ERROR: while `deleteById` in boardColumns.\n', error)
      return undefined
    }
  },
} as const
