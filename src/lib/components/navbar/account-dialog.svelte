<script lang='ts'>
  import { Button } from '$lib/components/ui/button'
  import * as Dialog from '$lib/components/ui/dialog'
  import { Input } from '$lib/components/ui/input'
  import PasswordInput from '$lib/components/ui/password-input.svelte'
  import * as Tabs from '$lib/components/ui/tabs'
  import { cn } from '$lib/utils'
  import { updatePasswordSchema, updateProfileSchema } from '$lib/zod-schemas'
  import { onMount } from 'svelte'
  import { toast } from 'svelte-sonner'
  import { updatePassword, updateProfile } from './data.remote'

  interface Props {
    controller?: { open: boolean }
    userName?: string
    userEmail?: string
  }
  const {
    controller = $bindable<{ open: boolean }>({ open: false }),
    userName = '',
    userEmail = '',
  }: Props = $props()

  const changing = $derived(!!updatePassword.pending)

  $effect(() => {
    if (updatePassword.result?.status === 200) {
      toast.success((updatePassword.result as any)?.message || 'Password has been updated successfully.')
    }
  })
  onMount(() => {
    updateProfile.fields.name.set(userName)
  })

</script>

<Dialog.Root bind:open={controller.open}>
  <Dialog.Content class='w-[min(92vw,560px)] max-w-[92vw]'>
    <Dialog.Header>
      <Dialog.Title>Account</Dialog.Title>
      <Dialog.Description>Manage your profile and password</Dialog.Description>
    </Dialog.Header>

    <Tabs.Root value='profile' class='mt-2 w-full'>
      <Tabs.List>
        <Tabs.Trigger value='profile'>Profile</Tabs.Trigger>
        <Tabs.Trigger value='password'>Password</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value='profile' class='pt-4'>
        <!-- Use remote form for profile update -->
        <form
          {...updateProfile.preflight(updateProfileSchema)} class='space-y-4'>
          <div class='grid gap-2'>
            <label for='name' class='text-sm font-medium'>Name</label>
            <Input {...updateProfile.fields.name.as('text')} placeholder='Your name' />
          </div>
          <div class='grid gap-2'>
            <label for='email' class='text-sm font-medium'>Email</label>
            <Input id='email' type='email' value={userEmail} disabled />
          </div>
          <div class='flex items-center justify-end gap-2'>
            <Dialog.Close type='button' class={cn(`
              rounded-md border px-3 py-2 text-sm
            `)}>
              Close
            </Dialog.Close>
            <Button type='submit'>Save</Button>
          </div>
        </form>
      </Tabs.Content>

      <Tabs.Content value='password' class='pt-4'>
        <form
          class='space-y-4'
          {...(updatePassword.preflight(updatePasswordSchema))}
        >
          <div class='grid gap-2'>
            <label for='currentPassword' class='text-sm font-medium'>Current password</label>
            <!-- <Input id='currentPassword' name='currentPassword' type='password' bind:value={currentPassword} autocomplete='current-password' /> -->
            <PasswordInput {...updatePassword.fields._currentPassword.as('password')} id='currentPassword' autocomplete='current-password' />
          </div>
          <div class='grid gap-2'>
            <label for='newPassword' class='text-sm font-medium'>New password</label>
            <PasswordInput {...updatePassword.fields._newPassword.as('password')} id='newPassword' autocomplete='new-password' />
          </div>
          <div class='grid gap-2'>
            <label for='confirmPassword' class='text-sm font-medium'>Confirm new password</label>
            <PasswordInput {...updatePassword.fields._confirmNewPassword.as('password')} id='confirmPassword' autocomplete='new-password' />
          </div>
          <div class='flex items-center justify-end gap-2'>
            <Dialog.Close type='button' class={cn(`
              rounded-md border px-3 py-2 text-sm
            `)}>
              Close
            </Dialog.Close>
            <Button type='submit' disabled={changing}>
              {changing ? 'Updating...' : 'Update password'}
            </Button>
          </div>
        </form>
      </Tabs.Content>
    </Tabs.Root>
  </Dialog.Content>
</Dialog.Root>
