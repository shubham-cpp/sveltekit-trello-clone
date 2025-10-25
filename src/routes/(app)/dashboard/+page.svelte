<script lang='ts'>
  import type { ViewMode } from '$lib/utils'
  import type { PageProps } from './$types'
  import { enhance } from '$app/forms'
  import BoardFilters from './_components/board-filters.svelte'
  import BoardList from './_components/board-list.svelte'
  import BoardStats from './_components/board-stats.svelte'
  import InvitePeopleDialog from './_components/invite-people-dialog.svelte'

  const { data }: PageProps = $props()

  let viewMode = $state<ViewMode>('grid')

  function onViewModeChange(newMode: ViewMode) {
    viewMode = newMode
  }

  const formId = 'create-board-id'
</script>

<div class='
  mb-6
  sm:mb-8
'>
  <h1>Welcome Back, {data.user.name}</h1>
  <p class='text-primary-foreground/80'>
    Here&apos;s what&apos;s happening with your boards today.
  </p>
  <form method='post' id={formId} use:enhance>
  </form>

  <div class='mt-4'>
    <InvitePeopleDialog />
  </div>

  <BoardStats boards={data.boards} memberCount={data.membersCount} pendingInvitesCount={data.pendingInvitesCount} />
  <BoardFilters {formId} {viewMode} {onViewModeChange} />
  <BoardList boards={data.boards} {viewMode} {formId} />
  <!-- TODO: implement Table view(list-view) -->
</div>
