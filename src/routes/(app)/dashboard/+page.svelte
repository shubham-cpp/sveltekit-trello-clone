<script lang='ts'>
  import type { ViewMode } from '$lib/utils'
  import type { PageProps } from './$types'
  import { enhance } from '$app/forms'
  import { useSearchParams } from 'runed/kit'
  import { z } from 'zod/v4'
  import BoardFilters from './_components/board-filters.svelte'
  import BoardList from './_components/board-list.svelte'
  import BoardStats from './_components/board-stats.svelte'
  import InvitePeopleDialog from './_components/invite-people-dialog.svelte'

  const { data }: PageProps = $props()

  const boardSearchSchema = z.object({
    q: z.string().default(''),
    created_at_min: z.string().default(''),
    created_at_max: z.string().default(''),
    created_at_exact: z.string().default(''),
    updated_at_min: z.string().default(''),
    updated_at_max: z.string().default(''),
    updated_at_exact: z.string().default(''),
    created_by: z.string().default(''),
    sort_by: z.enum(['updatedAt', 'createdAt', 'title']).default('updatedAt'),
    sort_dir: z.enum(['asc', 'desc']).default('desc'),
    view: z.enum(['grid', 'list']).default('grid'),
  })

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
        return a.title.localeCompare(b.title) * dir
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
    content={`List all the boards for ${data.user.name}`}
  />
  <meta name='author' content={`${data.user.name} - ${data.user.email}`} />
</svelte:head>

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
  <BoardFilters {formId} {viewMode} {onViewModeChange} {params} />
  <BoardList boards={filteredBoards} {viewMode} {formId} />
  <!-- TODO: implement Table view(list-view) -->
</div>
