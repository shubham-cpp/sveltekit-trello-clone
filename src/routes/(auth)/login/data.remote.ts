import { form } from '$app/server'
import { auth } from '$lib/server/auth'
import { loginSchema } from '$lib/zod-schemas'
import { fail } from '@sveltejs/kit'

export const signIn = form(
  loginSchema,
  async ({ email, _password: password }) => {
    let res: any
    try {
      res = await auth.api.signInEmail({
        body: {
          email,
          password,
          rememberMe: true,
        },
      })

      if (!(res as any)?.error?.message) {
        return { status: 200, message: 'Logged in successfully.' }
      }
    }
    catch (e) {
      console.error('Sign in failed', e)
      return fail(500, { error: 'Failed to sign in' })
    }
    if ((res as any)?.error?.message) {
      return fail(400, { error: (res as any).error.message })
    }
  },
)
