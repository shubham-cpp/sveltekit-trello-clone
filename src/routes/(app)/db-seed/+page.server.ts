import type { PageServerData } from './$types'
import { env } from '$env/dynamic/private'
import dbSeed from '$lib/scripts/seed'
import { redirect } from '@sveltejs/kit'

export const load: PageServerData = async () => {
  if (env.NODE_ENV !== 'development')
    redirect(308, '/dashboard')
  let result: any
  let error: Error
  try {
    result = await dbSeed()
  }
  catch (err) {
    error = err
  }
  return { result, error }
}
