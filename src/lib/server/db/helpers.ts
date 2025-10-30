import type { IColumn } from './types'
import { db } from '.'

export function getDefaultColumns(boardId: string): IColumn[] {
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
export async function getActiveOrganizationId(userId: string): Promise<string | undefined> {
  // const org = await auth.api.getFullOrganization({ headers: await getHeaders() })
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
