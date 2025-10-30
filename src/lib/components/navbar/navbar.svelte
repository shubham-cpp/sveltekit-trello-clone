<script lang='ts'>
  import { page } from '$app/state'
  import { buttonVariants } from '$ui/button'
  import { boardDetails } from '$lib/states/navbar-board-details.svelte'
  import ArrowBigLeftDash from '@lucide/svelte/icons/arrow-big-left-dash'
  import TrashIcon from '@lucide/svelte/icons/trash'
  import TrelloIcon from '@lucide/svelte/icons/trello'
  import ThemeToggle from '../theme-toggle.svelte'
  import EditBoardTitle from './edit-board-title.svelte'
  import FilterDialog from './filter-dialog.svelte'
  import Logo from './logo.svelte'
  import UserProfileMenu from './user-profile-menu.svelte'
  import WorkspaceProfileMenu from './workspace-profile-menu.svelte'

  const isRouteBoard = $derived(page.url.pathname.startsWith('/boards'))
  const isRouteDashboard = $derived(page.url.pathname === '/dashboard')
</script>

<header class='
  sticky top-0 z-50 border-b bg-neutral-50 p-4 backdrop-blur-md
  dark:bg-neutral-900
'>
  <nav class='flex items-center justify-between'>
    {#if isRouteBoard}
      <div class='flex items-center gap-x-2'>
        <a href='/dashboard' class={buttonVariants({ variant: 'outline' })}>
          <ArrowBigLeftDash /> <span class='
            hidden
            sm:inline
          '>Back to dashboard</span>
          <span class='
            inline
            sm:hidden
          '>Back</span>
        </a>
        <div role='separator' class='
          h-6 w-0.5 bg-foreground/20
          sm:h-7
        '></div>
        <div class='flex items-center gap-x-2'>
          <TrelloIcon class='
            size-6 text-green-600
            dark:text-green-500
          ' aria-label='logo icon' />
          <div class='
            flex items-center space-x-1 truncate
            sm:space-x-2
          '>
            <p class='
              hidden text-lg
              sm:inline
            '>{boardDetails.title}</p>
            <EditBoardTitle />
          </div>
        </div>
      </div>
    {:else}
      <Logo />
    {/if}
    <div class='flex items-center gap-x-2'>
      {#if isRouteBoard}
        <FilterDialog />
      {/if}

      {#if isRouteDashboard}
        <a href='/dashboard/trashed' class={buttonVariants({ variant: 'ghost' })} aria-label='Trashed boards'>
          <TrashIcon />
          <span class='
            hidden
            sm:inline
          '>Trash</span>
        </a>
      {/if}

      <WorkspaceProfileMenu />
      <UserProfileMenu />
      <ThemeToggle />
    </div>
  </nav>
</header>
