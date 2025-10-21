import type { Actions, PageServerLoad } from './$types'
import { signupSchema } from '$lib/zod-schemas'
import { fail, message, superValidate } from 'sveltekit-superforms'
import { zod4 as zod } from 'sveltekit-superforms/adapters'

export const load: PageServerLoad = async () => {
  return {
    form: await superValidate(zod(signupSchema)),
  }
}

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await superValidate(request, zod(signupSchema))

    if (!form.valid) {
      return fail(400, { form })
    }

    return message(form, 'Sign up request received.')
  },
}
