<script lang='ts'>
  import type { BoardWithColumnAndTask } from '$lib/server/db/types'

  import AddNewTaskForm from './add-new-task-form.svelte'

  interface BoardHeadingProps { board: BoardWithColumnAndTask }

  const { board }: BoardHeadingProps = $props()

  const totalTasks = $derived.by(() =>
    board.columns.reduce((sum, col) => sum + col.tasks.length, 0),
  )
  const columnLabelAndTotalCount = $derived.by(() => {
    return board.columns.map(c => ({ id: c.id, title: c.title, count: c.tasks.length }))
  })
</script>

<div class='flex items-center justify-between'>
  <div class='
    flex flex-wrap items-center gap-x-2 text-sm font-medium
    text-primary-foreground/70
    [&>span]:pr-2
    [&>span:not(:last-child)]:border-r
  '>
    <span>Total Tasks: {totalTasks} </span>
    {#each columnLabelAndTotalCount as c (c.id)}
      <span>{c.title}: {c.count} </span>
    {/each}
  </div>
  <AddNewTaskForm targetColumnId={board.columns?.[0]?.id} />
</div>
