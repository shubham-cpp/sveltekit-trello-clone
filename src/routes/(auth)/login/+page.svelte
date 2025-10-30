<script lang='ts'>
  import { goto } from '$app/navigation'
  import { authClient } from '$lib/auth-client.js'
  import SuperFormInput from '$lib/components/forms/super-form-input.svelte'
  import { loginSchema } from '$lib/zod-schemas'
  import { Button } from '$ui/button'
  import { toast } from 'svelte-sonner'
  import { superForm } from 'sveltekit-superforms'
  import { zod4Client } from 'sveltekit-superforms/adapters'

  const { data } = $props()
  const sf = superForm(data.form, {
    validators: zod4Client(loginSchema),
    async onUpdated({ form }) {
      if (!form.valid)
        return toast.dismiss()

      try {
        const res = await authClient.signIn.email({
          email: form.data.email,
          password: form.data._password,
          rememberMe: true,
        })
        if (res.error?.message)
          throw res.error.message
        goto('/dashboard')
        toast.success('Login successfully.')
      }
      catch {
        toast.error('Failed to login', { description: 'Please try again later.' })
      }
    },
  })
  const { enhance, submitting } = sf
</script>

<form
  method='POST'
  class='space-y-4'
  use:enhance
>
  <SuperFormInput
    superform={sf}
    field='email'
    label='Email'
    placeholder='john-doe@example.com'
    type='email'
  />

  <SuperFormInput
    superform={sf}
    field='_password'
    label='Password'
    type='password'
  />

  <Button disabled={$submitting} type='submit' class='w-full'>Login</Button>
</form>
