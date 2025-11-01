import type { Board } from '$db/types'
import type { Actions, PageServerLoad } from './$types'
import { boardQueries, invitationQueries, organizationQueries, organizationStatsQueries } from '$db/queries'
import { setActiveOrganizationSchema, updatePasswordSchema, updateProfileSchema } from '$lib/zod-schemas'
import { fail, redirect } from '@sveltejs/kit'
import { message, setError, superValidate } from 'sveltekit-superforms'
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
    const res = await Promise.allSettled([
      boardQueries.getAll(id),
      organizationStatsQueries.getActiveOrganizationMemberCount(id),
      organizationStatsQueries.getPendingInvitationCountForUser(email || ''),
    ])
    if (res[0].status === 'fulfilled') {
      boards = res[0].value
    }
    if (res[1].status === 'fulfilled') {
      membersCount = res[1].value
    }
    if (res[2].status === 'fulfilled') {
      pendingInvitesCount = res[2].value
    }
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
  email: z.email('Enter a valid email'),
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

    const ok = await invitationQueries.acceptInvitation(userId, form.data.invitationId)
    if (!ok) {
      return fail(400, { error: 'Invitation is no longer valid' })
    }
    return { success: true }
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

    const invite = await invitationQueries.inviteUserByEmail(userId, email, role)
    if (!invite) {
      return fail(400, { error: 'User is already a member or an invite already exists' })
    }
    return {
      status: 201,
      message: 'Invitation sent',
      invitationId: invite.id,
    }
  },

  rejectInvitation: async (event) => {
    const userId = event?.locals?.user?.id
    if (!userId)
      redirect(307, '/login')

    const form = await superValidate(event.request, zod4(acceptRejectSchema))
    if (!form.valid) {
      return fail(400, { error: 'Invalid form data' })
    }

    const ok = await invitationQueries.rejectInvitation(userId, form.data.invitationId)
    if (!ok) {
      return fail(400, { error: 'Invitation is no longer valid' })
    }
    return { success: true }
  },

  setActiveOrganization: async (event) => {
    const userId = event?.locals?.user?.id
    if (!userId)
      redirect(307, '/login')
    const orgId = (await event.request.formData()).get('organizationId')
    // const form = await superValidate(event.request, zod4(setActiveOrganizationSchema))

    if (!orgId) {
      return fail(400, { error: 'noope' })
    }

    const ok = await organizationQueries.setActiveOrganization(userId, orgId.toString())

    if (!ok) {
      // setError(form, 'organizationId', 'Unable to change organization. Please try again later')
      return fail(400, { error: 'noope' })
    }

    // Redirect back to dashboard to prevent page refresh issues with dropdown menu
    redirect(303, '/dashboard')
  },

} satisfies Actions
