<script lang='ts'>
  import { goto } from '$app/navigation'
  import FormInput from '$lib/components/forms/form-input.svelte'
  import { Button } from '$ui/button'
  import { signupSchema } from '$lib/zod-schemas'
  import { toast } from 'svelte-sonner'
  import { signUp } from './data.remote'

  const formData = signUp.fields

  $effect(() => {
    if ((signUp.result as any)?.status === 201) {
      toast.success((signUp.result as any)?.message || 'Account created successfully.')
      goto('/login')
    }
  })
</script>

<form
  {...signUp.preflight(signupSchema)}
  oninput={() => signUp.validate()}
  class='space-y-4'
>
  <div class='grid grid-cols-2 gap-3'>
    <FormInput
      field={formData.firstName}
      id='firstName'
      label='First Name'
      placeholder='First name'
      type='text'
      as='text'
    />

    <FormInput
      field={formData.lastName}
      id='lastName'
      label='Last Name'
      placeholder='Last name'
      type='text'
      as='text'
    />
  </div>

  <FormInput
    field={formData.email}
    id='email'
    label='Email'
    placeholder='you@example.com'
    type='email'
    as='email'
  />

  <FormInput
    field={formData._password}
    id='_password'
    label='Password'
    placeholder='********'
    type='password'
    as='password'
  />

  <FormInput
    field={formData._confirmPassword}
    id='_confirmPassword'
    label='Confirm Password'
    placeholder='********'
    type='password'
    as='password'
  />

  <Button type='submit' class='w-full'>Submit</Button>
</form>
