<script lang='ts'>
  import type { LoginFormSchema } from '$lib/zod-schemas'
  import type { Infer } from 'sveltekit-superforms'
  import { goto } from '$app/navigation'
  import { authClient } from '$lib/auth-client.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { loginSchema } from '$lib/zod-schemas'
  import { get } from 'svelte/store'
  import { superForm } from 'sveltekit-superforms'
  import { zod4Client as zodClient } from 'sveltekit-superforms/adapters'

  const { data } = $props()

  const form = superForm<Infer<LoginFormSchema>>(data.form, {
    validators: zodClient(loginSchema),
    async onResult({ result }) {
      if (result.type !== 'success')
        return
      try {
        // eslint-disable-next-line no-use-before-define
        const { email, password } = get(formData)

        const { error } = await authClient.signIn.email({ email, password, rememberMe: true })
        if (error?.message)
          throw new Error(error?.message)

        await goto('/dashboard')
      }
      catch (err) {
        console.error('Sign up failed', err)
      }
    },
  })

  const { form: formData, enhance } = form
</script>

<form method='POST' use:enhance>
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
