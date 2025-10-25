import type { Actions, PageServerLoad } from './$types'
import { boardQueries, organizationStatsQueries } from '$lib/server/db/queries'
import { fail, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async (events) => {
  const { email, id, name } = events?.locals?.user ?? {}
  let membersCount = 0
  let pendingInvitesCount = 0

  if (!id)
    redirect(307, '/login')

  try {
    membersCount = (await organizationStatsQueries.getActiveOrganizationMemberCount(id)) ?? 0
  }
  catch (error) {
    console.error('Error fetching organization member count:', error)
  }

  try {
    pendingInvitesCount = await organizationStatsQueries.getPendingInvitationCountForUser(email || '')
  }
  catch (error) {
    console.error('Error fetching pending invitations count:', error)
  }

  return {
    user: { id, email, name },
    boards: (await boardQueries.getAll(id)) ?? [],
    membersCount,
    pendingInvitesCount,
  }
}

export const actions = {
  default: async (event) => {
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
    }
  },
} satisfies Actions
