import { form, getRequestEvent } from '$app/server'
import { auth } from '$lib/server/auth'
import { signupSchema } from '$lib/zod-schemas'
import { fail, redirect } from '@sveltejs/kit'

export const signUp = form(
  signupSchema,
  async ({ firstName, lastName, email, _password }) => {
    const { locals } = getRequestEvent()
    if (locals?.user?.id)
      return fail(401, { error: 'Cannot signup right now.' })
    try {
      const res = await auth.api.signUpEmail({
        body: {
          name: `${firstName} ${lastName}`.trim(),
          email,
          password: _password,
        },
      })
      if ((res as any)?.error?.message) {
        return fail(400, { error: (res as any).error.message })
      }
      return { status: 201, message: 'Account created successfully. Please log in.' }
    }
    catch (e) {
      console.error('Sign up failed', e)
      return fail(500, { error: 'Failed to sign up' })
    }
  },
)
