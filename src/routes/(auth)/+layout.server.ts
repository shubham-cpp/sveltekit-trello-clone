import type { LayoutServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: LayoutServerLoad = async (events) => {
  if (events.locals.user?.id) {
    redirect(307, '/dashboard')
  }
  return {}
}
