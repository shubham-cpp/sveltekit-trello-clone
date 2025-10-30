import type { User } from 'better-auth'
import type { board, boardColumn, task } from './schema'

export type Board = typeof board.$inferSelect
export type BoardInsert = typeof board.$inferInsert

export type BoardColumn = typeof boardColumn.$inferSelect
export type BoardColumnInsert = typeof boardColumn.$inferInsert

export type BoardTask = typeof task.$inferSelect
export type BoardTaskInsert = typeof task.$inferInsert

export type BoardTaskWithUser = BoardTask & { ownerUser: User, assigneeUser: User }
export type BoardColumnWithTask = BoardColumn & { tasks: BoardTaskWithUser[] }
export type BoardWithColumnAndTask = Board & { columns: BoardColumnWithTask[] }

export type UpdateBoard = Pick<Board, 'id'> & Partial<Omit<Board, 'id' | 'isDeleted'>>
export type UpdateBoardColumn = Pick<BoardColumn, 'id'> & Partial<Omit<BoardColumn, 'id'>>
export type UpdateTask = Pick<BoardTask, 'id'> & Partial<Omit<BoardTask, 'id'>>

export type BoardWithColumn = Board & { columns: BoardColumn[] }

export type IColumn = Pick<BoardColumn, 'title' | 'sort_order' | 'boardId'>
