<script lang='ts'>
  import { authClient } from '$lib/auth-client'
  import { cn } from '$lib/utils'
  import { updateProfileSchema } from '$lib/zod-schemas'
  import Button from '$ui/button/button.svelte'
  import { DialogClose } from '$ui/dialog'
  import Input from '$ui/input/input.svelte'
  import { toast } from 'svelte-sonner'
  import { defaults, setError, superForm } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import SuperFormInput from '../forms/super-form-input.svelte'

  interface Props {
    onSuccess: () => void
    userName?: string
    userEmail?: string
  }
  const { userName, userEmail, onSuccess }: Props = $props()
  const sfProfile = superForm(
    defaults(zod4(updateProfileSchema), { id: 'profile-update', defaults: { name: userName } }),
    {
      validators: zod4(updateProfileSchema),
      async onUpdated({ form }) {
        if (userName === form.data.name) {
          setError(form, 'name', 'No change detected.')
        }
        else if (!form.valid) {
          return
        }
        const { name } = form.data
        const res = await authClient.updateUser({ name })
        if (res.error?.message) {
          return toast.error('Unable to perform update.')
        }
        onSuccess()
        toast.success('Name has been updated successfully.')
      },
    },
  )
  const { submitting: profileSubmitting, enhance } = sfProfile
</script>
<form
  method='POST'
  action='?/updateProfile'
  use:enhance
  class='space-y-4'>
  <SuperFormInput label='Full Name' superform={sfProfile} field='name' name='name' />
  <div class='grid gap-2'>
    <label for='email' class='text-sm font-medium'>Email</label>
    <Input id='email' type='email' value={userEmail} disabled />
  </div>
  <div class='flex items-center justify-end gap-2'>
    <DialogClose type='button' class={cn(`rounded-md border px-3 py-2 text-sm`)}>
      Close
    </DialogClose>
    <Button type='submit' disabled={$profileSubmitting}>Save</Button>
  </div>
</form>
