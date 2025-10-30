<script lang='ts'>
  import { goto } from '$app/navigation';
  import { authClient } from '$lib/auth-client.js'
  import SuperFormInput from '$lib/components/forms/super-form-input.svelte'
  import { signupSchema } from '$lib/zod-schemas'
  import { Button } from '$ui/button'
  import { toast } from 'svelte-sonner'
  import { superForm } from 'sveltekit-superforms'
  import { zod4Client } from 'sveltekit-superforms/adapters'

  const { data } = $props()
  const sf = superForm(data.form, {
    validators: zod4Client(signupSchema),
    async onUpdated({ form }) {
      if (!form.valid)
        return
      try {
        const { firstName, lastName, email, _password: password } = form.data
        const res = await authClient.signUp.email({
          name: `${firstName} ${lastName}`,
          email,
          password,
        })
        if (res?.error?.message)
          throw res.error.message
        goto('/dashboard')
        toast.success('Account created successfully.')
      }
      catch {
        toast.error('Failed to signup.', { description: 'There was an error while trying to sign-up. Please try again later.' })
      }
    },
  })
  const { submitting, enhance } = sf

</script>

<form
  use:enhance
  method='POST'
  class='space-y-4'
>
  <div class='grid grid-cols-2 gap-3'>
    <SuperFormInput
      superform={sf}
      field='firstName'
      label='First Name'
      placeholder='John'
      type='text'
    />

    <SuperFormInput
      superform={sf}
      field='lastName'
      label='Last Name'
      placeholder='Doe'
      type='text'
    />
  </div>

  <SuperFormInput
    superform={sf}
    field='email'
    label='Email'
    placeholder='john-doe@hotmail.com'
    type='email'
  />

  <SuperFormInput
    superform={sf}
    field='_password'
    label='Password'
    placeholder='************'
    type='password'
  />

  <SuperFormInput
    superform={sf}
    field='_confirmPassword'
    label='Confirm Password'
    placeholder='************'
    type='password'
  />

  <Button type='submit' class='w-full' disabled={$submitting}>Submit</Button>
</form>
