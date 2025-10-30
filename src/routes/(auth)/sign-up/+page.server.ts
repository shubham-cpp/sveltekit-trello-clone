import { db } from '$db'
import { signupSchema as schema } from '$lib/zod-schemas'
import { fail, redirect } from '@sveltejs/kit'
import { message, setError, superValidate } from 'sveltekit-superforms'
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
      return fail(400, { form })

    const email = form.data.email
    const foundAccountWithEmail = await db.query.user.findFirst({
      where: (u, op) => op.eq(u.email, email),
    })
    if (foundAccountWithEmail) {
      setError(form, 'email', 'Email already exists.')

      return fail(400, { form })
    }

    return message(form, 'Accounted created successfully.')
  },
}
