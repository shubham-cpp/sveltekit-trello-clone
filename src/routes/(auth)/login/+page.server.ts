import { loginSchema as schema } from '$lib/zod-schemas'
import { fail, redirect } from '@sveltejs/kit'
import { message, superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'

export async function load() {
  return { form: await superValidate(zod4(schema)) }
}

export const actions = {
  default: async ({ request, locals }) => {
    if (locals?.user?.id)
      redirect(307, '/dashboard')
    const form = await superValidate(request, zod4(schema))

    if (!form.valid)
      fail(400, { form })
    return message(form, 'You\'re ready to login.')
  },
}
