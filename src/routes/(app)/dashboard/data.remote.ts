import { command, getRequestEvent, query } from '$app/server'
import { invitationQueries, organizationQueries } from '$lib/server/db/queries'
import { fail, redirect } from '@sveltejs/kit'
import { z } from 'zod/v4'

// Search schema
const searchUsersSchema = z.object({
  q: z.string().trim().min(1, 'Enter at least 1 character').max(128),
})

// Invite schema
const inviteUserSchema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.string().trim().min(1).default('member'),
})

/**
 * Search users NOT in the active organization
 * - excludes current user
 * - excludes existing org members
 * - excludes already invited (pending) emails
 */
export const searchUsersToInvite = query(searchUsersSchema, async ({ q }) => {
  const { locals } = getRequestEvent()
  const userId = locals.user?.id

  if (!userId) {
    return fail(401, { error: 'Unauthorized' })
  }

  try {
    const results = await invitationQueries.searchUsersNotInActiveOrganization(userId, q)
    return Array.isArray(results) ? results : []
  }
  catch (error) {
    console.error('Error searching users to invite:', error)
    return fail(500, { error: 'Failed to search users' })
  }
})

/**
 * Create (or reuse) a pending invitation for the active organization
 */
export const inviteUser = command(inviteUserSchema, async ({ email, role }) => {
  const { locals } = getRequestEvent()
  const userId = locals.user?.id

  if (!userId) {
    return redirect(307, '/login')
  }

  try {
    const invite = await invitationQueries.inviteUserByEmail(userId, email, role)
    if (!invite) {
      return fail(400, { error: 'User is already a member or an invite already exists' })
    }
    return {
      status: 201,
      message: 'Invitation sent',
      invitationId: invite.id,
    }
  }
  catch (error) {
    console.error('Error creating invitation:', error)
    return fail(500, { error: 'Failed to create invitation' })
  }
})

// Search organization members (for 'Created by' filter)
const searchMembersSchema = z.object({
  query: z.string(),
})

export const searchOrganizationMembers = query(
  searchMembersSchema,
  async ({ query }) => {
    const { locals } = getRequestEvent()
    const userId = locals.user?.id

    if (!userId) {
      return fail(401, { error: 'Unauthorized' })
    }

    try {
      const activeOrg = await organizationQueries.getActiveOrganization(userId)
      if (!activeOrg) {
        return fail(400, { error: 'No active organization' })
      }

      const members = await organizationQueries.searchMembers(activeOrg.id, query)
      return Array.isArray(members) ? members : []
    }
    catch (error) {
      console.error('Error searching organization members:', error)
      return fail(500, { error: 'Failed to search organization members' })
    }
  },
)

// Pending invitations: list, accept, reject
const acceptRejectSchema = z.object({
  invitationId: z.string().trim().min(1),
})

export const listPendingInvitations = query(async () => {
  const { locals } = getRequestEvent()
  const email = locals.user?.email

  if (!email) {
    return []
  }

  try {
    const items = await invitationQueries.listPendingForUser(email)
    return Array.isArray(items) ? items : []
  }
  catch (error) {
    console.error('Error listing pending invitations:', error)
    return fail(500, { error: 'Failed to load invitations' })
  }
})

export const acceptInvitationRequest = command(acceptRejectSchema, async ({ invitationId }) => {
  const { locals } = getRequestEvent()
  const userId = locals.user?.id

  if (!userId) {
    return redirect(307, '/login')
  }

  try {
    const ok = await invitationQueries.acceptInvitation(userId, invitationId)
    if (!ok) {
      return fail(400, { error: 'Invitation is no longer valid' })
    }
    return { success: true }
  }
  catch (error) {
    console.error('Error accepting invitation:', error)
    return fail(500, { error: 'Failed to accept invitation' })
  }
})

export const rejectInvitationRequest = command(acceptRejectSchema, async ({ invitationId }) => {
  const { locals } = getRequestEvent()
  const userId = locals.user?.id

  if (!userId) {
    return redirect(307, '/login')
  }

  try {
    const ok = await invitationQueries.rejectInvitation(userId, invitationId)
    if (!ok) {
      return fail(400, { error: 'Invitation is no longer valid' })
    }
    return { success: true }
  }
  catch (error) {
    console.error('Error rejecting invitation:', error)
    return fail(500, { error: 'Failed to reject invitation' })
  }
})
