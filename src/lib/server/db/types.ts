import type { board, boardColumn, task } from './schema'

export type Board = typeof board.$inferSelect
export type BoardInsert = typeof board.$inferInsert

export type BoardColumn = typeof boardColumn.$inferSelect
export type BoardColumnInsert = typeof boardColumn.$inferInsert

export type BoardTask = typeof task.$inferSelect
export type BoardTaskInsert = typeof task.$inferInsert

export type BoardTaskWithUser = BoardTask & { ownerUser: any, assigneeUser: any }
export type BoardColumnWithTask = BoardColumn & { tasks: BoardTaskWithUser[] }
export type BoardWithColumnAndTask = Board & { columns: BoardColumnWithTask[] }
