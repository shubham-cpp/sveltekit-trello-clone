import type { User as BUser } from 'better-auth'
import { eq } from 'drizzle-orm'
import { isNotNil, pickBy } from 'es-toolkit'
import { db } from '..'
import { getActiveOrganizationId } from '../helpers'
import { organization, session } from '../schema'

type User = Pick<BUser, 'id' | 'name' | 'email' | 'image'> & { role: string }
export const organizationQueries = {
  async searchMembers(
    organizationId: string,
    searchQuery: string,
  ): Promise<undefined | User[]> {
    try {
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
        columns: {
          updatedAt: false,
        },
        where: (m, { eq }) => eq(m.userId, userId),
        with: {
          organization: {
            columns: {
              updatedAt: false,
            },
          },
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
