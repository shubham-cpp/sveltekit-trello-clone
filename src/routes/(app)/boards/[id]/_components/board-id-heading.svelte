<script lang='ts'>
  import type { Board, BoardColumn, BoardTask } from '$lib/server/db/types'

  import type { AddNewTaskSchema } from '$lib/zod-schemas'
  import type { SuperValidated } from 'sveltekit-superforms'
  import AddNewTaskForm from './add-new-task-form.svelte'

  export type INewTaskForm = SuperValidated<{
    title: string
    due_date: Date
    assignee: string
    description?: string | undefined
    priority?: 'low' | 'medium' | 'high' | undefined
    sort_order?: number | undefined
  }, any, {
    title: string
    due_date: Date
    assignee: string
    description?: string | undefined
    priority?: 'low' | 'medium' | 'high' | undefined
    sort_order?: number | undefined
  }>

  type BoardTaskWithUser = BoardTask & { ownerUser: any, assigneeUser: any }
  type BoardColumnWithTask = BoardColumn & { tasks: BoardTaskWithUser[] }
  interface BoardHeadingProps { board: Board & { columns: BoardColumnWithTask[] }, form: SuperValidated<AddNewTaskSchema> }

  const { board, form }: BoardHeadingProps = $props()

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
  <AddNewTaskForm {form} />
</div>
