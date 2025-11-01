import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '..'
import { getActiveOrganizationId } from '../helpers'
import { invitation, member } from '../schema'

export interface InviteItem {
  id: string
  organizationId: string
  organizationName: string
  organizationSlug: string
  organizationLogo: string | null
  role: string
  inviterName: string | null
  inviterEmail: string | null
  expiresAt: Date
}

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

  async listPendingForUser(userEmail: string): Promise<InviteItem[]> {
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
    try {
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
    }
    catch (error) {
      console.error('ERROR: while trying to `acceptInvitation`.\n', error)
      return false
    }
  },

  async rejectInvitation(userId: string, invitationId: string): Promise<boolean> {
    try {
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
    }
    catch (error) {
      console.error('ERROR: while trying to `rejectInvitation`.\n', error)
      return false
    }
  },
} as const
