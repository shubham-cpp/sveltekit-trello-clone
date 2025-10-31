<script lang='ts'>
  import { authClient } from '$lib/auth-client'
  import { cn } from '$lib/utils'
  import { updatePasswordSchema } from '$lib/zod-schemas'
  import Button from '$ui/button/button.svelte'
  import { DialogClose } from '$ui/dialog'
  import { toast } from 'svelte-sonner'
  import { defaults, superForm } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import SuperFormInput from '../forms/super-form-input.svelte'

  interface Props {
    onSuccess: () => void
  }
  const { onSuccess }: Props = $props()

  const sfPassword = superForm(
    defaults(zod4(updatePasswordSchema), { id: 'password-update' }),
    {
      validators: zod4(updatePasswordSchema),
      async onUpdated({ form }) {
        if (!form.valid) {
          return
        }
        const { _currentPassword: currentPassword, _newPassword: newPassword } = form.data
        const res = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        })
        if (res.error?.message) {
          return toast.error('Unable to update password.')
        }
        onSuccess()
        toast.success('Password has been changed successfully.')
      },
    },
  )
  const { submitting, enhance } = sfPassword
</script>
<form
  class='space-y-4'
  method='POST'
  action='?/updatePassword'
  use:enhance
>
  <SuperFormInput
    superform={sfPassword}
    field='_currentPassword'
    label='Current Password'
    type='password'
  />
  <SuperFormInput
    superform={sfPassword}
    field='_newPassword'
    label='New Password'
    type='password'
  />
  <SuperFormInput
    superform={sfPassword}
    field='_confirmNewPassword'
    label='Confirm New Password'
    type='password'
  />
  <div class='flex items-center justify-end gap-2'>
    <DialogClose type='button' class={cn(`rounded-md border px-3 py-2 text-sm`)}>
      Close
    </DialogClose>
    <Button disabled={$submitting} type='submit'>
      Update password
    </Button>
  </div>
</form>
