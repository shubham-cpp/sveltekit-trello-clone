<script lang='ts'>
  import { authClient } from '$lib/auth-client'
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar'
  import { buttonVariants } from '$lib/components/ui/button/button.svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
  import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte'
  import { cn, getPrefix } from '$lib/utils'
  import UserIcon from '@lucide/svelte/icons/user'
  import AccountDialog from './account-dialog.svelte'
  import SignOutButton from './sign-out-button.svelte'

  const session = authClient.useSession()
  const user = $derived($session?.data?.user)

  // Controller for Account dialog
  let accountDlg = $state<{ open: boolean }>({ open: false })

  function openAccountDialog() {
    accountDlg.open = true
  }
</script>

{#if $session?.isPending}
  <div class='flex flex-col items-center space-y-1'>
    <Skeleton class='h-3 w-4 rounded-full' />
    <Skeleton class='h-4 w-8' />
  </div>
{:else if user}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class={cn(buttonVariants({ size: 'icon', variant: 'outline' }), `
      cursor-pointer
    `)}>
      <Avatar class='bg-transparent'>
        <AvatarImage src={user?.image ?? ''} alt={user?.name ?? ''} class='
          object-cover
        ' />
        <AvatarFallback class='bg-transparent'>
          {getPrefix(user?.name ?? '')}
        </AvatarFallback>
      </Avatar>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class='sm:mr-8'>
      <DropdownMenu.Label>
        <p class="">{user?.name}</p>
        <p class='truncate text-xs font-normal text-muted-foreground' title={user?.email}>
          {user?.email}
        </p>
      </DropdownMenu.Label>
      <DropdownMenu.Separator />
      <DropdownMenu.Group>
        <DropdownMenu.Item onclick={openAccountDialog}>
          <UserIcon /> Account
        </DropdownMenu.Item>
      </DropdownMenu.Group>
      <DropdownMenu.Separator />
      <SignOutButton />
    </DropdownMenu.Content>
  </DropdownMenu.Root>

  <!-- Account dialog mounted once, toggled via controller -->
  <AccountDialog bind:controller={accountDlg} userName={user?.name ?? ''} userEmail={user?.email ?? ''} />
{:else}
  <a href='/login' class={cn(buttonVariants(), 'cursor-pointer')}> Login</a>
{/if}
