<script lang='ts'>
  import { goto } from '$app/navigation'
  import FormInput from '$lib/components/forms/form-input.svelte'
  import { Button } from '$ui/button'
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
  <FormInput
    field={formData.email}
    id='email'
    label='Email'
    placeholder='john-doe@example.com'
    type='email'
  />

  <FormInput
    field={formData._password}
    id='password'
    label='Password'
    type='password'
  />

  <Button type='submit' class='w-full'>Submit</Button>
</form>
