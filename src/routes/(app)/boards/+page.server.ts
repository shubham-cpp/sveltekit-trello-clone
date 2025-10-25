import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async (event) => {
  const { locals } = event
  const userId = locals?.user?.id

  if (!userId)
    redirect(307, '/login')
  redirect(308, '/dashboard')
}
