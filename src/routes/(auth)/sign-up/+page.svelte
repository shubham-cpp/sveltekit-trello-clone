<script lang='ts'>
  import { goto } from '$app/navigation'
  import { Button } from '$lib/components/ui/button'
  import * as Field from '$lib/components/ui/field'
  import { Input } from '$lib/components/ui/input/index.js'
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
    <Field.Field aria-invalid={!!formData.firstName.issues()?.length}>
      <Field.Label
        aria-invalid={!!formData.firstName.issues()?.length}
        for='firstName'
      >
        First Name
      </Field.Label>
      <Input
        {...formData.firstName.as('text')}
        id='firstName'
        placeholder='First name'
        aria-invalid={!!formData.firstName.issues()?.length}
      />
      <Field.Error
        class='
          hidden
          aria-invalid:block
        '
        aria-invalid={!!formData.firstName.issues()?.length}
      >
        {formData.firstName.issues()?.map(i => i.message)?.join(',')}
      </Field.Error>
    </Field.Field>

    <Field.Field aria-invalid={!!formData.lastName.issues()?.length}>
      <Field.Label
        aria-invalid={!!formData.lastName.issues()?.length}
        for='lastName'
      >
        Last Name
      </Field.Label>
      <Input
        {...formData.lastName.as('text')}
        id='lastName'
        placeholder='Last name'
        aria-invalid={!!formData.lastName.issues()?.length}
      />
      <Field.Error
        class='
          hidden
          aria-invalid:block
        '
        aria-invalid={!!formData.lastName.issues()?.length}
      >
        {formData.lastName.issues()?.map(i => i.message)?.join(',')}
      </Field.Error>
    </Field.Field>
  </div>

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
      for='_password'
    >
      Password
    </Field.Label>
    <Input
      {...formData._password.as('password')}
      id='_password'
      placeholder='********'
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

  <Field.Field aria-invalid={!!formData._confirmPassword.issues()?.length}>
    <Field.Label
      aria-invalid={!!formData._confirmPassword.issues()?.length}
      for='_confirmPassword'
    >
      Confirm Password
    </Field.Label>
    <Input
      {...formData._confirmPassword.as('password')}
      id='_confirmPassword'
      placeholder='********'
      aria-invalid={!!formData._confirmPassword.issues()?.length}
    />
    <Field.Error
      class='
        hidden
        aria-invalid:block
      '
      aria-invalid={!!formData._confirmPassword.issues()?.length}
    >
      {formData._confirmPassword.issues()?.map(i => i.message)?.join(',')}
    </Field.Error>
  </Field.Field>

  <Button type='submit' class='w-full'>Submit</Button>
</form>
