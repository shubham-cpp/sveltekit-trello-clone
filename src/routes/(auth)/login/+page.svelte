<script lang='ts'>
  import { goto } from '$app/navigation'
  import { Button } from '$lib/components/ui/button'
  import * as Field from '$lib/components/ui/field'
  import { Input } from '$lib/components/ui/input'
  import PasswordInput from '$lib/components/ui/password-input.svelte'
  import { loginSchema } from '$lib/zod-schemas'
  import { toast } from 'svelte-sonner'
  import { signIn } from './data.remote'

  const formData = signIn.fields

  $effect(() => {
    if ((signIn.result as any)?.status === 200) {
      toast.success('Logged in successfully.')
      goto('/dashboard')
    }
  })
</script>

<form
  {...signIn.preflight(loginSchema)}
  oninput={() => signIn.validate()}
  class='space-y-4'
>
  <Field.Field aria-invalid={!!formData.email.issues()?.length}>
    <Field.Label
      aria-invalid={!!formData.email.issues()?.length}
      for='email'
    >
      Email
    </Field.Label>
    <Input
      {...formData.email.as('email')}
      id='email'
      placeholder='you@example.com'
      aria-invalid={!!formData.email.issues()?.length}
    />
    <Field.Error
      class='
        hidden
        aria-invalid:block
      '
      aria-invalid={!!formData.email.issues()?.length}
    >
      {formData.email.issues()?.map(i => i.message)?.join(',')}
    </Field.Error>
  </Field.Field>

  <Field.Field aria-invalid={!!formData._password.issues()?.length}>
    <Field.Label
      aria-invalid={!!formData._password.issues()?.length}
      for='password'
    >
      Password
    </Field.Label>
    <PasswordInput
      {...formData._password.as('password')}
      id='password'
      aria-invalid={!!formData._password.issues()?.length}
    />
    <Field.Error
      class='
        hidden
        aria-invalid:block
      '
      aria-invalid={!!formData._password.issues()?.length}
    >
      {formData._password.issues()?.map(i => i.message)?.join(',')}
    </Field.Error>
  </Field.Field>

  <Button type='submit' class='w-full'>Submit</Button>
</form>
