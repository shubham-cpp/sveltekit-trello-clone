<script lang='ts'>
  import type { PageProps } from './$types'
  import { goto } from '$app/navigation'
  import { authClient } from '$lib/auth-client'
  import * as Form from '$lib/components/ui/form/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { signupSchema } from '$lib/zod-schemas'
  import { toast } from 'svelte-sonner'
  import { superForm } from 'sveltekit-superforms'
  import { zod4Client as zodClient } from 'sveltekit-superforms/adapters'

  const { data }: PageProps = $props()

  const form = superForm(data.form, {
    validators: zodClient(signupSchema),
    onUpdated: async ({ form }) => {
      if (!form.valid)
        return
      try {
        const { firstName, lastName, email, password } = form.data

        const { error } = await authClient.signUp.email({
          name: `${firstName} ${lastName}`,
          email,
          password,
        })
        if (error?.message)
          throw new Error(error?.message)

        await goto('/login')
      }
      catch {
        toast.error('Server Error', {
          description: 'Some error occurred while sign-up. Please try again later',
        })
      }
    },
  })

  const { form: formData, enhance } = form
</script>

<form method='POST' use:enhance>
  <div class='grid grid-cols-2 gap-3'>
    <Form.Field {form} name='firstName'>
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>First Name</Form.Label>
          <Input {...props} bind:value={$formData.firstName} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
    <Form.Field {form} name='lastName'>
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Last Name</Form.Label>
          <Input {...props} bind:value={$formData.lastName} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
  </div>

  <Form.Field {form} name='email'>
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Email</Form.Label>
        <Input {...props} type='email' bind:value={$formData.email} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>
  <Form.Field {form} name='password'>
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Password</Form.Label>
        <Input {...props} type='password' bind:value={$formData.password} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>
  <Form.Button class='w-full'>Submit</Form.Button>
</form>
