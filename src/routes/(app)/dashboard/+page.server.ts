import type { Board } from '$db/types'
import type { Actions, PageServerLoad } from './$types'
import { boardQueries, organizationStatsQueries } from '$db/queries'
import { fail, redirect } from '@sveltejs/kit'

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
