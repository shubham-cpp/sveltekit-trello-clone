import type { User } from 'better-auth';
import { db } from '.';
import type { Board, BoardColumn, BoardTask } from './types';
import { board, boardColumn, task } from './schema';
import { eq, and, asc } from 'drizzle-orm';
import { pickBy, isNotNil } from 'es-toolkit';

type UpdateBoard = Pick<Board, 'id'> & Partial<Omit<Board, 'id' | 'isDeleted'>>;
type UpdateBoardColumn = Pick<BoardColumn, 'id'> & Partial<Omit<BoardColumn, 'id'>>;
type UpdateTask = Pick<BoardTask, 'id'> & Partial<Omit<BoardTask, 'id'>>;

type BoardWithColumn = Board & { columns: BoardColumn[] };
type BoardWithColumnAndTasks = Board & { columns: (BoardColumn & { tasks: BoardTask })[] };

function getDefaultColumns(
	boardId: string
): Pick<BoardColumn, 'title' | 'sort_order' | 'boardId'>[] {
	const cols = [
		{ title: 'Todo', sort_order: 0 },
		{ title: 'In Progress', sort_order: 1 },
		{ title: 'Review', sort_order: 2 },
		{ title: 'Done', sort_order: 3 }
	] as const;

	return cols.map(
		(c): Pick<BoardColumn, 'title' | 'sort_order' | 'boardId'> => ({ ...c, boardId })
	);
}

export const boardQueries = {
	async createWithDefaultColumns(
		userId: string,
		boardData: Omit<Board, 'id' | 'userId' | 'isDeleted' | 'createdAt' | 'updatedAt'>
	): Promise<undefined | BoardWithColumn> {
		try {
			const [newBoard] = await db
				.insert(board)
				.values({
					...(pickBy(boardData, isNotNil) as Board),
					userId: userId,
					isDeleted: false
				})
				.returning();

			if (!newBoard) return undefined;

			const newColumns = await db
				.insert(boardColumn)
				.values(getDefaultColumns(newBoard.id))
				.returning();

			return { ...newBoard, columns: newColumns };
		} catch (error) {
			console.error('ERROR: while `create` in boards.\n', error);
			return undefined;
		}
	},
	async create(
		userId: string,
		boardData: Omit<Board, 'id' | 'userId' | 'isDeleted' | 'createdAt' | 'updatedAt'>
	): Promise<undefined | Board> {
		try {
			const [newBoard] = await db
				.insert(board)
				.values({
					...(pickBy(boardData, isNotNil) as Board),
					userId: userId,
					isDeleted: false
				})
				.returning();

			return newBoard;
		} catch (error) {
			console.error('ERROR: while `create` in boards.\n', error);
			return undefined;
		}
	},
	async getAll(userId: string, onlyDeleted = false): Promise<undefined | Board[]> {
		try {
			return await db.query.board.findMany({
				where: ({ userId: dbUserId, isDeleted }, { eq, and }) =>
					and(eq(dbUserId, userId), eq(isDeleted, onlyDeleted)),
				orderBy: ({ updatedAt }, { desc }) => desc(updatedAt)
			});
		} catch (error) {
			console.error('ERROR: while `getAll` in boards.\n', error);
			return undefined;
		}
	},
	async getWithColumnsAndTasksById(userId: string, boardId: string, onlyDeleted = false) {
		try {
			return await db.query.board.findFirst({
				where: (b, { eq, and }) =>
					and(eq(b.userId, userId), eq(b.id, boardId), eq(b.isDeleted, onlyDeleted)),
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
											image: true
										}
									},
									ownerUser: {
										columns: {
											id: true,
											name: true,
											email: true,
											image: true
										}
									}
								}
							}
						}
					}
				}
			});
		} catch (error) {
			console.error('ERROR: while `getById` in boards.\n', error);
			return undefined;
		}
	},
	async unDeleteById(userId: string, boardId: string): Promise<undefined | Board> {
		try {
			const foundBoard = await db.query.board.findFirst({
				where: ({ userId: dbUserId, id, isDeleted }, { eq, and }) =>
					and(eq(dbUserId, userId), eq(id, boardId), eq(isDeleted, true))
			});

			if (!foundBoard) return undefined;

			const [updatedBoard] = await db
				.update(board)
				.set({
					isDeleted: false
				})
				.where(eq(board.id, foundBoard.id))
				.returning();

			return updatedBoard;
		} catch (error) {
			console.error('ERROR: while `unDeleteById` in boards.\n', error);
			return undefined;
		}
	},
	async deleteById(userId: string, boardId: string): Promise<undefined | Board> {
		try {
			const foundBoard = await db.query.board.findFirst({
				where: ({ userId: dbUserId, id, isDeleted }, { eq, and }) =>
					and(eq(dbUserId, userId), eq(id, boardId), eq(isDeleted, false))
			});

			if (!foundBoard) return undefined;

			const [updatedBoard] = await db
				.update(board)
				.set({
					isDeleted: true
				})
				.where(eq(board.id, foundBoard.id))
				.returning();

			return updatedBoard;
		} catch (error) {
			console.error('ERROR: while `deleteById` in boards.\n', error);
			return undefined;
		}
	},
	async updateById(userId: string, boardObj: UpdateBoard): Promise<undefined | Board> {
		try {
			const updatedBoardObj = pickBy(boardObj, isNotNil);
			const foundBoard = await db.query.board.findFirst({
				where: ({ userId: dbUserId, id, isDeleted }, { eq, and }) =>
					and(eq(dbUserId, userId), eq(id, boardObj.id), eq(isDeleted, false))
			});
			if (!foundBoard) return undefined;

			const [updatedBoard] = await db
				.update(board)
				.set(updatedBoardObj)
				.where(eq(board.id, foundBoard.id))
				.returning();

			return updatedBoard;
		} catch (error) {
			console.error('ERROR: while `updateById` in boards.\n', error);
			return undefined;
		}
	}
} as const;

export const boardColumnQueries = {
	async getAll(userId: string, boardId: string) {
		try {
			const foundBoard = await db.query.board.findFirst({
				where: ({ userId: dbUserId, id, isDeleted }, { eq, and }) =>
					and(eq(dbUserId, userId), eq(id, boardId), eq(isDeleted, false)),
				with: {
					columns: {
						orderBy: ({ sort_order }, { asc }) => asc(sort_order)
					}
				}
			});

			return foundBoard;
		} catch (error) {
			console.error('ERROR: while `getAll` in boardColumns.\n', error);
			return undefined;
		}
	},
	async getById(userId: string, columnId: string): Promise<undefined | BoardColumn> {
		try {
			const result = await db
				.select()
				.from(boardColumn)
				.innerJoin(board, eq(boardColumn.boardId, board.id))
				.where(
					and(eq(boardColumn.id, columnId), eq(board.userId, userId), eq(board.isDeleted, false))
				)
				.get();

			if (!result) return undefined;

			return result.board_column;
		} catch (error) {
			console.error('ERROR: while `getById` in boardColumns.\n', error);
			return undefined;
		}
	},
	async create(
		userId: string,
		boardId: string,
		columnData: Omit<BoardColumn, 'id' | 'boardId' | 'createdAt' | 'updatedAt'>
	): Promise<undefined | BoardColumn> {
		try {
			const foundBoard = await db.query.board.findFirst({
				where: ({ userId: dbUserId, id, isDeleted }, { eq, and }) =>
					and(eq(dbUserId, userId), eq(id, boardId), eq(isDeleted, false))
			});

			if (!foundBoard) return undefined;

			// Then create the column
			const [newColumn] = await db
				.insert(boardColumn)
				.values({
					...columnData,
					boardId
				})
				.returning();

			return newColumn;
		} catch (error) {
			console.error('ERROR: while `create` in boardColumns.\n', error);
			return undefined;
		}
	},
	async updateById(userId: string, columnObj: UpdateBoardColumn): Promise<undefined | BoardColumn> {
		try {
			const updatedColumnObj = pickBy(columnObj, isNotNil);

			const result = await db
				.select()
				.from(boardColumn)
				.innerJoin(board, eq(boardColumn.boardId, board.id))
				.where(
					and(
						eq(boardColumn.id, columnObj.id),
						eq(board.userId, userId),
						eq(board.isDeleted, false)
					)
				)
				.get();

			if (!result) return undefined;

			// Update the column
			const [updatedColumn] = await db
				.update(boardColumn)
				.set(updatedColumnObj)
				.where(eq(boardColumn.id, columnObj.id))
				.returning();

			return updatedColumn;
		} catch (error) {
			console.error('ERROR: while `updateById` in boardColumns.\n', error);
			return undefined;
		}
	},
	async deleteById(userId: string, columnId: string): Promise<undefined | BoardColumn> {
		try {
			const result = await db
				.select()
				.from(boardColumn)
				.innerJoin(board, eq(boardColumn.boardId, board.id))
				.where(
					and(eq(boardColumn.id, columnId), eq(board.userId, userId), eq(board.isDeleted, false))
				)
				.get();

			if (!result) return undefined;

			const [deletedColumn] = await db
				.delete(boardColumn)
				.where(eq(boardColumn.id, columnId))
				.returning();

			return deletedColumn;
		} catch (error) {
			console.error('ERROR: while `deleteById` in boardColumns.\n', error);
			return undefined;
		}
	}
} as const;

export const taskQueries = {
	async getAll(
		userId: string,
		boardId: string,
		columnId?: string
	): Promise<undefined | BoardTask[]> {
		try {
			const foundBoard = await db.query.board.findFirst({
				where: ({ userId: dbUserId, id, isDeleted }, { eq, and }) =>
					and(eq(dbUserId, userId), eq(id, boardId), eq(isDeleted, false))
			});

			if (!foundBoard) return undefined;

			if (columnId) {
				return await db.query.task.findMany({
					where: ({ boardId: taskBoardId, boardColumnId }, { eq, and }) =>
						and(eq(taskBoardId, boardId), eq(boardColumnId, columnId)),
					orderBy: ({ sort_order }, { asc }) => asc(sort_order)
				});
			} else {
				return await db.query.task.findMany({
					where: ({ boardId: taskBoardId }, { eq }) => eq(taskBoardId, boardId),
					orderBy: ({ sort_order }, { asc }) => asc(sort_order)
				});
			}
		} catch (error) {
			console.error('ERROR: while `getAll` in tasks.\n', error);
			return undefined;
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
				.get();

			if (!result) return undefined;

			return result.task;
		} catch (error) {
			console.error('ERROR: while `getById` in tasks.\n', error);
			return undefined;
		}
	},
	async create(
		userId: string,
		boardId: string,
		columnId: string,
		taskData: Omit<
			BoardTask,
			'id' | 'boardId' | 'boardColumnId' | 'owner' | 'createdAt' | 'updatedAt'
		>
	): Promise<undefined | BoardTask> {
		try {
			// First check if the user owns the board
			const foundBoard = await db.query.board.findFirst({
				where: ({ userId: dbUserId, id, isDeleted }, { eq, and }) =>
					and(eq(dbUserId, userId), eq(id, boardId), eq(isDeleted, false))
			});

			if (!foundBoard) return undefined;

			// Then check if the column exists and belongs to the board
			const foundColumn = await db.query.boardColumn.findFirst({
				where: ({ id, boardId: columnBoardId }, { eq, and }) =>
					and(eq(id, columnId), eq(columnBoardId, boardId))
			});

			if (!foundColumn) return undefined;

			// Then create the task
			const [newTask] = await db
				.insert(task)
				.values({
					...taskData,
					boardId,
					boardColumnId: columnId,
					owner: userId
				})
				.returning();

			return newTask;
		} catch (error) {
			console.error('ERROR: while `create` in tasks.\n', error);
			return undefined;
		}
	},
	async updateById(userId: string, taskObj: UpdateTask): Promise<undefined | BoardTask> {
		try {
			const updatedTaskObj = pickBy(taskObj, isNotNil);

			// Get the task and join with board to check ownership
			const result = await db
				.select()
				.from(task)
				.innerJoin(board, eq(task.boardId, board.id))
				.where(and(eq(task.id, taskObj.id), eq(board.userId, userId), eq(board.isDeleted, false)))
				.get();

			if (!result) return undefined;

			// Update the task
			const [updatedTask] = await db
				.update(task)
				.set(updatedTaskObj)
				.where(eq(task.id, taskObj.id))
				.returning();

			return updatedTask;
		} catch (error) {
			console.error('ERROR: while `updateById` in tasks.\n', error);
			return undefined;
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
				.get();

			if (!result) return undefined;

			// Delete the task
			const [deletedTask] = await db.delete(task).where(eq(task.id, taskId)).returning();

			return deletedTask;
		} catch (error) {
			console.error('ERROR: while `deleteById` in tasks.\n', error);
			return undefined;
		}
	},
	async moveToColumn(
		userId: string,
		taskId: string,
		newColumnId: string
	): Promise<undefined | BoardTask> {
		try {
			// Get the task and join with board to check ownership
			const taskResult = await db
				.select()
				.from(task)
				.innerJoin(board, eq(task.boardId, board.id))
				.where(and(eq(task.id, taskId), eq(board.userId, userId), eq(board.isDeleted, false)))
				.get();

			if (!taskResult) return undefined;

			// Check if the column exists and belongs to the same board
			const columnResult = await db
				.select()
				.from(boardColumn)
				.where(
					and(eq(boardColumn.id, newColumnId), eq(boardColumn.boardId, taskResult.task.boardId))
				)
				.get();

			if (!columnResult) return undefined;

			// Update the task with the new column
			const [updatedTask] = await db
				.update(task)
				.set({
					boardColumnId: newColumnId
				})
				.where(eq(task.id, taskId))
				.returning();

			return updatedTask;
		} catch (error) {
			console.error('ERROR: while `moveToColumn` in tasks.\n', error);
			return undefined;
		}
	}
} as const;
