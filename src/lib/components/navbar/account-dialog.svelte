<script lang='ts'>
  import FormInput from '$lib/components/forms/form-input.svelte'
  import { cn } from '$lib/utils'
  import { updatePasswordSchema, updateProfileSchema } from '$lib/zod-schemas'
  import { Button } from '$ui/button'
  import * as Dialog from '$ui/dialog'
  import { Input } from '$ui/input'
  import * as Tabs from '$ui/tabs'
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
            <FormInput
              field={updatePassword.fields._currentPassword}
              id='currentPassword'
              label='Current password'
              type='password'
              as='password'
              autocomplete='current-password'
            />
          </div>
          <div class='grid gap-2'>
            <FormInput
              field={updatePassword.fields._newPassword}
              id='newPassword'
              label='New password'
              type='password'
              as='password'
              autocomplete='new-password'
            />
          </div>
          <div class='grid gap-2'>
            <FormInput
              field={updatePassword.fields._confirmNewPassword}
              id='confirmPassword'
              label='Confirm new password'
              type='password'
              as='password'
              autocomplete='new-password'
            />
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
