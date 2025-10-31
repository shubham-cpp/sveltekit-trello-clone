<script lang='ts'>
  import * as Dialog from '$ui/dialog'
  import * as Tabs from '$ui/tabs'
  import UpdatePasswordForm from './update-password-form.svelte'
  import UpdateProfileForm from './update-profile-form.svelte'

  interface Props {
    controller?: { open: boolean }
    userName?: string
    userEmail?: string
  }
  let {
    controller = $bindable<{ open: boolean }>({ open: false }),
    userName = '',
    userEmail = '',
  }: Props = $props()

  function onSuccess() {
    controller.open = false
  }
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
        <UpdateProfileForm {userEmail} {userName} {onSuccess} />
      </Tabs.Content>

      <Tabs.Content value='password' class='pt-4'>
        <UpdatePasswordForm {onSuccess} />
      </Tabs.Content>
    </Tabs.Root>
  </Dialog.Content>
</Dialog.Root>
