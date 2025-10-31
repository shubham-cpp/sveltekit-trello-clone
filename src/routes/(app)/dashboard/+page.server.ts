import type { Board } from '$db/types'
import type { Actions, PageServerLoad } from './$types'
import { boardQueries, invitationQueries, organizationStatsQueries } from '$db/queries'
import { updatePasswordSchema, updateProfileSchema } from '$lib/zod-schemas'
import { fail, redirect } from '@sveltejs/kit'
import { message, superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import { z } from 'zod/v4'

export const load: PageServerLoad = async (events) => {
  const { email, id, name } = events?.locals?.user ?? {}
  let membersCount: number | undefined = 0
  let pendingInvitesCount = 0
  let boards: Board[] | undefined = []

  if (!id)
    redirect(307, '/login')

  try {
    [boards, membersCount, pendingInvitesCount] = await Promise.all([boardQueries.getAll(id), organizationStatsQueries.getActiveOrganizationMemberCount(id), organizationStatsQueries.getPendingInvitationCountForUser(email || '')])
  }
  catch (error) {
    console.error('Error fetching organization member count:', error)
  }

  return {
    user: { id, email, name },
    boards: boards ?? [],
    membersCount: membersCount ?? 0,
    pendingInvitesCount,
  }
}

const acceptRejectSchema = z.object({
  invitationId: z.string().trim().min(1),
})

const inviteUserSchema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.string().trim().min(1).default('member'),
})

export const actions = {
  createDashboard: async (event) => {
    const userId = event?.locals?.user?.id
    if (!userId)
      return fail(403, 'You don\'t have access')
    try {
      await boardQueries.createWithDefaultColumns(userId, {
        title: 'New Board',
        description: 'This is a demo board',
        color: null,
      })
    }
    catch (error) {
      console.error('ERROR: while submitting form action for `create-new-board`', error)
      return fail(500, 'Unable to create board right.')
    }
  },
  updateProfile: async (event) => {
    const userId = event?.locals?.user?.id

    if (!userId)
      return fail(403, 'You don\'t have access')

    const form = await superValidate(event.request, zod4(updateProfileSchema))

    if (!form.valid) {
      return fail(403, 'Invalid form details.')
    }
    return message(form, 'Form will be updated.')
  },
  updatePassword: async (event) => {
    const userId = event?.locals?.user?.id

    if (!userId)
      return fail(403, 'You don\'t have access')

    const form = await superValidate(event.request, zod4(updatePasswordSchema))

    if (!form.valid) {
      return fail(403, 'Invalid form details.')
    }

    return message(form, 'Your password will be updated.')
  },

  acceptInvitation: async (event) => {
    const userId = event?.locals?.user?.id
    if (!userId)
      redirect(307, '/login')

    const form = await superValidate(event.request, zod4(acceptRejectSchema))
    if (!form.valid) {
      return fail(400, { error: 'Invalid form data' })
    }

    try {
      const ok = await invitationQueries.acceptInvitation(userId, form.data.invitationId)
      if (!ok) {
        return fail(400, { error: 'Invitation is no longer valid' })
      }
      return { success: true }
    }
    catch (error) {
      console.error('Error accepting invitation:', error)
      return fail(500, { error: 'Failed to accept invitation' })
    }
  },

  inviteUser: async (event) => {
    const userId = event?.locals?.user?.id
    if (!userId)
      redirect(307, '/login')

    const form = await superValidate(event.request, zod4(inviteUserSchema))
    if (!form.valid) {
      return fail(400, { error: 'Invalid form data' })
    }

    const { email, role } = form.data

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
  },
} satisfies Actions
