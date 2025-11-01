<script lang='ts'>
  import type { ViewMode } from '$lib/utils'
  import type { PageProps } from './$types'
  import { enhance } from '$app/forms'
  import { authClient } from '$lib/auth-client'
  import { boardSearchSchema } from '$lib/zod-schemas'
  import { useSearchParams } from 'runed/kit'
  import BoardFilters from './_components/board-filters.svelte'
  import BoardList from './_components/board-list.svelte'
  import BoardStats from './_components/board-stats.svelte'
  import InvitePeopleDialog from './_components/invite-people-dialog.svelte'

  const { data }: PageProps = $props()
  const session = authClient.useSession()
  const user = $derived($session?.data?.user || data.user)
  const params = useSearchParams(boardSearchSchema, {
    debounce: 300,
    pushHistory: false,
    showDefaults: false,
  })

  const viewMode = $derived(params.view) as ViewMode

  function onViewModeChange(newMode: ViewMode) {
    params.view = newMode
  }

  const filteredBoards = $derived.by(() => {
    let boards = [...data.boards]

    const q = (params.q ?? '').toLowerCase().trim()
    if (q) {
      boards = boards.filter((b) => {
        const t = (b.title ?? '').toLowerCase()
        const d = (b.description ?? '').toLowerCase()
        return t.includes(q) || d.includes(q)
      })
    }

    if (params.created_by) {
      boards = boards.filter((b: any) => (b.userId ?? b.owner ?? b.user_id) === params.created_by)
    }

    function matchesDate(target: Date, exact: string, min: string, max: string): boolean {
      if (!target)
        return false
      const dayStr = target.toISOString().split('T')[0]
      if (exact) {
        return dayStr === exact
      }
      if (min && dayStr < min)
        return false
      if (max && dayStr > max)
        return false
      return true
    }

    if (params.created_at_exact || params.created_at_min || params.created_at_max) {
      boards = boards.filter((b: any) => {
        const d = new Date(b.createdAt)
        if (Number.isNaN(d.getTime()))
          return false
        return matchesDate(d, params.created_at_exact, params.created_at_min, params.created_at_max)
      })
    }

    if (params.updated_at_exact || params.updated_at_min || params.updated_at_max) {
      boards = boards.filter((b: any) => {
        const d = new Date(b.updatedAt)
        if (Number.isNaN(d.getTime()))
          return false
        return matchesDate(d, params.updated_at_exact, params.updated_at_min, params.updated_at_max)
      })
    }

    const sortBy = params.sort_by
    const dir = params.sort_dir === 'asc' ? 1 : -1
    boards.sort((a: any, b: any) => {
      if (sortBy === 'title') {
        return (a.title ?? '').localeCompare(b.title ?? '') * dir
      }
      if (sortBy === 'ownerName') {
        const an = a?.owner?.name ?? ''
        const bn = b?.owner?.name ?? ''
        return an.localeCompare(bn) * dir
      }
      const av = new Date(a[sortBy]).getTime()
      const bv = new Date(b[sortBy]).getTime()
      return (av - bv) * dir
    })

    return boards
  })

  const formId = 'create-board-id'
</script>

<svelte:head>
  <title>Dashboard Page</title>
  <meta
    name='description'
    content={`List all the boards for ${user.name}`}
  />
  <meta name='author' content={`${user.name} - ${user.email}`} />
</svelte:head>

<div class='
  mb-6
  sm:mb-8
'>
  <h1 id='welcome-back-user'>Welcome Back, {user.name}</h1>
  <p class='text-primary-foreground/80'>
    Here&apos;s what&apos;s happening with your boards today.
  </p>
  <form action='?/createDashboard' method='post' id={formId} use:enhance>
  </form>

  <div class='mt-4'>
    <InvitePeopleDialog />
  </div>

  <BoardStats boards={data.boards} memberCount={data.membersCount} pendingInvitesCount={data.pendingInvitesCount} />
  <BoardFilters {formId} {viewMode} {onViewModeChange} {params} />
  <BoardList boards={filteredBoards} {viewMode} {formId} />
  <!-- TODO: implement Table view(list-view) -->
</div>
