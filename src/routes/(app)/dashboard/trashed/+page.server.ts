import type { Actions, PageServerLoad } from './$types'
import { boardQueries } from '$db/queries'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async (event) => {
  const userId = event?.locals?.user?.id
  const name = event?.locals?.user?.name ?? ''
  const email = event?.locals?.user?.email ?? ''

  if (!userId) {
    redirect(307, '/login')
  }

  const boards = (await boardQueries.getAll(userId!, true)) ?? []

  return {
    user: { id: userId!, name, email },
    boards,
  }
}

// No classic actions here; mutations are handled via remote form functions in data.remote.ts
export const actions: Actions = {}
