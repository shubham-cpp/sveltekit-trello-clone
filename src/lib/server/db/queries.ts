import type { MoveTaskColumnSchema, UpdateTaskSortOrderSchema } from '$lib/zod-schemas'
import type { Board, BoardColumn, BoardTask } from './types'
import { and, eq, gt, inArray, sql } from 'drizzle-orm'
import { isNotNil, pickBy } from 'es-toolkit'
import { nanoid } from 'nanoid'
import { db } from '.'
import { board, boardColumn, invitation, member, organization, session, task, user } from './schema'

type UpdateBoard = Pick<Board, 'id'> & Partial<Omit<Board, 'id' | 'isDeleted'>>
type UpdateBoardColumn = Pick<BoardColumn, 'id'> & Partial<Omit<BoardColumn, 'id'>>
type UpdateTask = Pick<BoardTask, 'id'> & Partial<Omit<BoardTask, 'id'>>

type BoardWithColumn = Board & { columns: BoardColumn[] }

type IColumn = Pick<BoardColumn, 'title' | 'sort_order' | 'boardId'>

function getDefaultColumns(boardId: string): IColumn[] {
  const cols = [
    { title: 'Todo', sort_order: 0 },
    { title: 'In Progress', sort_order: 1 },
    { title: 'Review', sort_order: 2 },
    { title: 'Done', sort_order: 3 },
  ] as const

  return cols.map((c): IColumn => ({ ...c, boardId }))
}

/**
 * Helper: resolve the user's active organization id.
 * - Prefer the latest session.activeOrganizationId
 * - Fallback to the latest membership's organization
 */
async function getActiveOrganizationId(userId: string): Promise<string | undefined> {
  // const org = await auth.api.getFullOrganization({ headers: await getHeaders() })
  // console.log(org)
  const sess = await db.query.session.findFirst({
    where: (s, { eq }) => eq(s.userId, userId),
    orderBy: (s, { desc }) => desc(s.createdAt),
  })
  if (sess?.activeOrganizationId)
    return sess.activeOrganizationId

  const ms = await db.query.member.findFirst({
    where: (m, { eq }) => eq(m.userId, userId),
    with: {
      organization: {
        columns: {
          id: true,
        },
      },
    },
    orderBy: (m, { desc }) => desc(m.createdAt),
  })
  return ms?.organization.id
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
        orderBy: ({ updatedAt }, { desc }) => desc(updatedAt),
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
        where: ({ userId: dbUserId, id, organizationId, isDeleted }, { eq, and }) =>
          and(eq(dbUserId, userId), eq(id, boardId), eq(organizationId, activeOrgId), eq(isDeleted, true)),
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
} as const

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
          and(eq(boardColumn.id, columnId), eq(board.userId, userId), eq(board.isDeleted, false)),
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
      // First check if the user owns the board
      const foundBoard = await db.query.board.findFirst({
        where: ({ userId: dbUserId, id, isDeleted }, { eq, and }) =>
          and(eq(dbUserId, userId), eq(id, boardId), eq(isDeleted, false)),
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
      const res = await db.transaction(async (tx) => {
        const found = await tx.query.board.findFirst({
          where: (b, op) => op.and(
            op.eq(b.id, boardId),
            op.eq(b.userId, userId),
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
      const res = await db.transaction(async (tx) => {
        const found = await tx.query.board.findFirst({
          where: (b, op) => op.and(
            op.eq(b.id, boardId),
            op.eq(b.userId, userId),
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

export const organizationQueries = {
  async searchMembers(
    organizationId: string,
    searchQuery: string,
  ): Promise<undefined | Array<{
    id: string
    name: string
    email: string
    image: string | null
    role: string
  }>> {
    try {
      // Get all members of the organization with their user details
      const members = await db.query.member.findMany({
        where: (m, { eq }) => eq(m.organizationId, organizationId),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      })

      if (!members || members.length === 0) {
        return []
      }

      // Filter members by name or email containing the search query
      const filteredMembers = members.filter(m =>
        m.user.name.toLowerCase().includes(searchQuery.toLowerCase())
        || m.user.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )

      // Map to the expected return format
      return filteredMembers.map(m => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        role: m.role,
      }))
    }
    catch (error) {
      console.error('ERROR: while `searchMembers` in organization.\n', error)
      return undefined
    }
  },

  async getUserOrganizations(
    userId: string,
  ): Promise<undefined | Array<{
    id: string
    name: string
    slug: string
    logo: string | null
    role: string
    isOwner: boolean
  }>> {
    try {
      // Get all organizations the user is a member of
      const memberships = await db.query.member.findMany({
        where: (m, { eq }) => eq(m.userId, userId),
        with: {
          organization: true,
        },
        orderBy: (m, { desc }) => desc(m.createdAt),
      })

      if (!memberships || memberships.length === 0) {
        return []
      }

      // Map to the expected return format and determine if user is owner
      return memberships.map(m => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        logo: m.organization.logo,
        role: m.role,
        isOwner: m.role === 'owner',
      }))
    }
    catch (error) {
      console.error('ERROR: while `getUserOrganizations` in organization.\n', error)
      return undefined
    }
  },

  async updateOrganization(
    userId: string,
    organizationId: string,
    data: { name?: string, slug?: string },
  ): Promise<undefined | { id: string, name: string, slug: string }> {
    try {
      // First check if the user is the owner of the organization
      const membership = await db.query.member.findFirst({
        where: (m, { eq, and }) => and(
          eq(m.userId, userId),
          eq(m.organizationId, organizationId),
          eq(m.role, 'owner'),
        ),
      })

      if (!membership) {
        return undefined // User is not the owner
      }

      // Update the organization
      const [updatedOrg] = await db
        .update(organization)
        .set(pickBy(data, isNotNil))
        .where(eq(organization.id, organizationId))
        .returning()

      if (!updatedOrg) {
        return undefined
      }

      return {
        id: updatedOrg.id,
        name: updatedOrg.name,
        slug: updatedOrg.slug,
      }
    }
    catch (error) {
      console.error('ERROR: while `updateOrganization` in organization.\n', error)
      return undefined
    }
  },

  async getActiveOrganization(userId: string): Promise<undefined | { id: string, name: string }> {
    try {
      // Find the most recent session for the user to get the active organization ID
      const session = await db.query.session.findFirst({
        where: (s, { eq }) => eq(s.userId, userId),
        orderBy: (s, { desc }) => desc(s.createdAt),
      })

      if (!session?.activeOrganizationId) {
        // If no active organization in session, find the first organization the user is a member of
        const membership = await db.query.member.findFirst({
          where: (m, { eq }) => eq(m.userId, userId),
          with: {
            organization: true,
          },
        })

        if (!membership) {
          return undefined
        }

        return {
          id: membership.organization.id,
          name: membership.organization.name,
        }
      }

      // Get the active organization details
      const activeOrgId = session.activeOrganizationId
      if (!activeOrgId) {
        return undefined
      }

      const org = await db.query.organization.findFirst({
        where: (o, { eq }) => eq(o.id, activeOrgId),
      })

      if (!org) {
        return undefined
      }

      return {
        id: org.id,
        name: org.name,
      }
    }
    catch (error) {
      console.error('ERROR: while `getActiveOrganization` in organization.\n', error)
      return undefined
    }
  },

  async setActiveOrganization(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    try {
      // First check if the user is a member of the organization
      const membership = await db.query.member.findFirst({
        where: (m, { eq, and }) => and(
          eq(m.userId, userId),
          eq(m.organizationId, organizationId),
        ),
      })

      if (!membership) {
        return false // User is not a member
      }

      // Update the user's session with the new active organization
      await db
        .update(session)
        .set({ activeOrganizationId: organizationId })
        .where(eq(session.userId, userId))

      return true
    }
    catch (error) {
      console.error('ERROR: while `setActiveOrganization` in organization.\n', error)
      return false
    }
  },
} as const

// Invitation and user discovery queries
export const invitationQueries = {
  /**
   * Return users matching query `q` that are NOT members of the user's active organization.
   * Also excludes the current user and users that already have a pending invite in the org.
   */
  async searchUsersNotInActiveOrganization(
    userId: string,
    q: string,
  ): Promise<Array<{ id: string, name: string, email: string, image: string | null }>> {
    const query = q.trim()
    if (!query)
      return []

    const activeOrgId = await getActiveOrganizationId(userId)
    if (!activeOrgId)
      return []

    // Current org members
    const members = await db.query.member.findMany({
      where: (m, { eq }) => eq(m.organizationId, activeOrgId),
      columns: {
        userId: true,
      },
    })
    const memberIds = members.map(m => m.userId)

    // Pending invitations by email in this org
    const pendingInvites = await db.query.invitation.findMany({
      where: (i, { and, eq }) => and(eq(i.organizationId, activeOrgId), eq(i.status, 'pending')),
      columns: {
        email: true,
      },
    })
    const invitedEmails = new Set(pendingInvites.map(i => i.email.toLowerCase()))

    // Find users by name/email, exclude org members, exclude self
    const candidates = await db.query.user.findMany({
      where: (u, { and, or, like, notInArray, ne }) => and(
        or(
          like(u.name, `%${query}%`),
          like(u.email, `%${query}%`),
        ),
        memberIds.length > 0 ? notInArray(u.id, memberIds) : undefined,
        ne(u.id, userId),
      ),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      limit: 20,
    })

    // Exclude users that already have a pending invitation
    return candidates.filter(u => !invitedEmails.has((u.email || '').toLowerCase()))
  },

  /**
   * Create or reuse a pending invitation for the user's active organization
   */
  async inviteUserByEmail(
    userId: string,
    email: string,
    role: string = 'member',
  ) {
    const activeOrgId = await getActiveOrganizationId(userId)
    if (!activeOrgId)
      return undefined

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail)
      return undefined

    // If user already a member, ignore
    const existingUser = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.email, normalizedEmail),
      columns: {
        id: true,
      },
    })
    if (existingUser) {
      const existingMembership = await db.query.member.findFirst({
        where: (m, { and, eq }) => and(eq(m.userId, existingUser.id), eq(m.organizationId, activeOrgId)),
        columns: {
          id: true,
        },
      })
      if (existingMembership) {
        // already a member
        return undefined
      }
    }

    // If a non-expired pending invite exists, return it
    const existingInvite = await db.query.invitation.findFirst({
      where: (i, { and, eq }) => and(
        eq(i.organizationId, activeOrgId),
        eq(i.email, normalizedEmail),
        eq(i.status, 'pending'),
      ),
    })

    if (existingInvite) {
      return existingInvite
    }

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days

    const [newInvite] = await db
      .insert(invitation)
      .values({
        id: nanoid(),
        organizationId: activeOrgId,
        email: normalizedEmail,
        role,
        status: 'pending',
        expiresAt,
        inviterId: userId,
      })
      .returning()

    return newInvite
  },
  async listPendingForUser(userEmail: string): Promise<Array<{
    id: string
    organizationId: string
    organizationName: string
    organizationSlug: string
    organizationLogo: string | null
    role: string
    inviterName: string | null
    inviterEmail: string | null
    expiresAt: Date
  }>> {
    const normalized = (userEmail ?? '').trim().toLowerCase()
    if (!normalized)
      return []

    const rows = await db.query.invitation.findMany({
      where: (i, { and, eq, gt }) => and(
        eq(i.email, normalized),
        eq(i.status, 'pending'),
        gt(i.expiresAt, new Date()),
      ),
      with: {
        organization: true,
        inviter: {
          columns: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: (i, { desc }) => desc(i.expiresAt),
    })

    return rows.map(r => ({
      id: r.id,
      organizationId: r.organizationId,
      organizationName: r.organization?.name ?? '',
      organizationSlug: r.organization?.slug ?? '',
      organizationLogo: r.organization?.logo ?? null,
      role: r.role ?? 'member',
      inviterName: r.inviter?.name ?? null,
      inviterEmail: r.inviter?.email ?? null,
      expiresAt: r.expiresAt,
    }))
  },

  async acceptInvitation(userId: string, invitationId: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Resolve current user's email
      const u = await tx.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, userId),
      })
      if (!u?.email)
        return false
      const normalized = u.email.trim().toLowerCase()

      // Fetch invitation (must be addressed to this user and valid)
      const inv = await tx.query.invitation.findFirst({
        where: (i, { and, eq, gt }) => and(
          eq(i.id, invitationId),
          eq(i.email, normalized),
          eq(i.status, 'pending'),
          gt(i.expiresAt, new Date()),
        ),
      })
      if (!inv)
        return false

      // Create membership if not exists
      const existing = await tx.query.member.findFirst({
        where: (m, { and, eq }) => and(
          eq(m.organizationId, inv.organizationId),
          eq(m.userId, userId),
        ),
      })

      if (!existing) {
        await tx.insert(member).values({
          id: nanoid(),
          organizationId: inv.organizationId,
          userId,
          role: inv.role ?? 'member',
        })
      }

      // Mark invitation as accepted
      await tx.update(invitation)
        .set({ status: 'accepted' })
        .where(eq(invitation.id, inv.id))

      return true
    })
  },

  async rejectInvitation(userId: string, invitationId: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Resolve current user's email
      const u = await tx.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, userId),
      })
      if (!u?.email)
        return false
      const normalized = u.email.trim().toLowerCase()

      const inv = await tx.query.invitation.findFirst({
        where: (i, { and, eq, gt }) => and(
          eq(i.id, invitationId),
          eq(i.email, normalized),
          eq(i.status, 'pending'),
          gt(i.expiresAt, new Date()),
        ),
      })
      if (!inv)
        return false

      await tx.update(invitation)
        .set({ status: 'rejected' })
        .where(eq(invitation.id, inv.id))

      return true
    })
  },
} as const

export const organizationStatsQueries = {
  async getActiveOrganizationMemberCount(userId: string): Promise<number | undefined> {
    const activeOrgId = await getActiveOrganizationId(userId)
    if (!activeOrgId)
      return undefined

    const rows = await db.query.member.findMany({
      where: (m, { eq }) => eq(m.organizationId, activeOrgId),
      columns: {
        id: true,
      },
    })
    return rows.length
  },

  async getPendingInvitationCountForUser(userEmail: string): Promise<number> {
    const normalized = (userEmail ?? '').trim().toLowerCase()
    if (!normalized)
      return 0

    const rows = await db.query.invitation.findMany({
      where: (i, { and, eq, gt }) => and(
        eq(i.email, normalized),
        eq(i.status, 'pending'),
        gt(i.expiresAt, new Date()),
      ),
      columns: {
        id: true,
      },
    })
    return rows.length
  },
} as const
