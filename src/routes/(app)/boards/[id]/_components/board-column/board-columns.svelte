<script lang='ts'>
  import type { BoardColumnWithTask, BoardTaskWithUser, BoardWithColumnAndTask } from '$lib/server/db/types'
  import type { UpdateTaskSortOrderSchema } from '$lib/zod-schemas'
  import type { ActionFailure } from '@sveltejs/kit'
  import type { DndEvent } from 'svelte-dnd-action'
  import Badge from '$lib/components/ui/badge/badge.svelte'
  import Button from '$lib/components/ui/button/button.svelte'
  import * as Card from '$lib/components/ui/card/index.js'
  import { df } from '$lib/utils'
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis'
  import UserIcon from '@lucide/svelte/icons/user'
  import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME, TRIGGERS } from 'svelte-dnd-action'
  import { toast } from 'svelte-sonner'
  import { flip } from 'svelte/animate'
  import { cubicIn } from 'svelte/easing'
  import { fade } from 'svelte/transition'
  import { moveTaskColumn, updateTaskSortOrder } from '../../data.remote'
  import AddNewTaskForm from '../add-new-task-form.svelte'

  interface BoardColumnsProps {
    board: BoardWithColumnAndTask
  }
  type NewSortOrder = UpdateTaskSortOrderSchema['newSortOrder'][0]

  const flipDurationMs = 250

  const { board }: BoardColumnsProps = $props()

  // eslint-disable-next-line prefer-const
  let boardColumns = $state(board.columns)

  type TaskDndEvent = (
    cid: string,
    e: CustomEvent<DndEvent<BoardTaskWithUser>>,
  ) => void

  const handleDndConsiderTaskOrder: TaskDndEvent = (cid, e) => {
    const colIdx = boardColumns.findIndex(c => c.id === cid)
    boardColumns[colIdx].tasks = e.detail.items
  }

  const handleDndFinalizeTaskOrder: TaskDndEvent = async (cid, e) => {
    const colIdx = boardColumns.findIndex(c => c.id === cid)
    if (colIdx < 0)
      return

    const newColumnId = (e.target as HTMLElement).id
    const trigger = e.detail.info.trigger

    const newSortOrder = e.detail.items
      .map<NewSortOrder>((it, idx) => ({ id: it.id, newIndex: idx }))

    const isSameColumn
      = e.detail.items.every(t => t.boardColumnId === newColumnId)
        && trigger === TRIGGERS.DROPPED_INTO_ZONE

    const isAnotherColumn
      = e.detail.items.some(t => t.boardColumnId !== newColumnId)
        && trigger === TRIGGERS.DROPPED_INTO_ZONE

    let res: boolean | undefined | ActionFailure<{ error: string }> = false

    if (isSameColumn) {
      res = await updateTaskSortOrder({ columnId: cid, newSortOrder })
    }
    else if (isAnotherColumn) {
      res = await moveTaskColumn({
        newSortOrder,
        taskId: e.detail.info.id,
        newColumnId,
      })
    }
    if (res === true) {
      toast.success('Update successfully.')
    }
    else if (trigger === TRIGGERS.DROPPED_INTO_ZONE) {
      toast.error('Failed to update.')
    }

    boardColumns[colIdx].tasks = e.detail.items
  }

  function getPriorityColor(priority: BoardTaskWithUser['priority']) {
    switch (priority) {
      case 'medium':
        return 'bg-orange-400'
      case 'high':
        return 'bg-red-500'
      default:
        return 'bg-green-500'
    }
  }
</script>

<div class='
  flex flex-col space-y-4 pt-6
  lg:-mx-2 lg:flex-row lg:space-y-0 lg:space-x-6 lg:overflow-x-auto lg:px-2
  lg:pb-6 lg:[&::-webkit-scrollbar]:h-2
  lg:[&::-webkit-scrollbar-thumb]:rounded-full
  lg:[&::-webkit-scrollbar-thumb]:bg-gray-300
  lg:dark:[&::-webkit-scrollbar-thumb]:bg-gray-600
  lg:[&::-webkit-scrollbar-track]:bg-gray-100
  lg:dark:[&::-webkit-scrollbar-track]:bg-gray-800
'>
  {#each boardColumns as col (col.id)}
    {@render column(col)}
  {/each}
</div>

{#snippet column(col: BoardColumnWithTask)}
  <div class='
    w-full rounded-lg shadow-2xl
    lg:w-80 lg:shrink-0
  '
  >
    <div class='
      flex h-full flex-col rounded-lg bg-zinc-50 px-2
      dark:bg-zinc-900
    '>
      <!-- Header -->
      <div class='
        rounded-lg border-b p-3
        sm:p-4
      '>
        <div class='flex items-center justify-between'>
          <div class='flex min-w-0 items-center gap-x-2'>
            <h3 class='
              text-sm font-semibold
              sm:text-base
            '>{col.title}</h3>
            <Badge variant='secondary' class='shrink-0 text-xs'>{col.tasks.length}</Badge>
          </div>
          <!-- TODO: post-click we should present a dialog to update the task title -->
          <Button class='shrink-0' size='icon-sm' variant='outline'> <EllipsisIcon /> </Button>
        </div>
      </div>
      <!-- Task List -->
      <div
        class='
          grow space-y-2 p-2
          sm:space-y-3
        '
        id={col.id}
        use:dndzone={{
          items: col.tasks,
          flipDurationMs,
          dropTargetStyle: { border: '2px dashed orange' },
        }}
        onconsider={e => handleDndConsiderTaskOrder(col.id, e)}
        onfinalize={e => handleDndFinalizeTaskOrder(col.id, e)}
      >
        {#each col.tasks as t (t.id)}
          <div class='relative rounded-lg' animate:flip={{ duration: flipDurationMs }}>
            {#if (t as any)[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
              <div in:fade={{ duration: 200, easing: cubicIn }} class='
                visible absolute inset-0 m-0 rounded-lg border-2 border-dashed
                border-gray-500 opacity-50
              '>{@render renderTask(t)}</div>
            {/if}
            {@render renderTask(t)}
          </div>
        {:else}
          <p>No tasks here</p>
        {/each}
      </div>
      <AddNewTaskForm
        targetColumnId={col.id}
        variant='ghost' class='
          my-2 w-full text-primary-foreground/60
          hover:text-primary-foreground
        '
      />
    </div>
  </div>
{/snippet}

{#snippet renderTask(t: BoardTaskWithUser)}
  <Card.Root class='
    cursor-move py-2 transition-shadow
    hover:shadow-md
  '>
    <Card.Content class='
      p-3
      sm:p-4
    '>
      <div class='
        space-y-2
        sm:space-y-3
      '>
        <!-- Task Header -->
        <div class='flex items-start justify-between'>
          <h4 class='min-w-0 flex-1 pr-2 leading-tight font-medium'>{t.title}</h4>
        </div>
        <p class='line-clamp-2 text-sm text-primary-foreground/60'>{t.description || 'No Description'}</p>
        <div class='flex items-center justify-between'>
          <div class='
            flex min-w-0 items-center gap-x-1
            sm:gap-x-2
          '>
            {#if t.assignee}
              <div class='
                flex items-center gap-x-1 text-xs text-primary-foreground/60
              '>
                <UserIcon class='size-3.5' />
                <span class='truncate'>{t.assigneeUser.name}</span>
              </div>
            {/if}
            {#if t.due_date}
              <div class='
                flex items-center gap-x-1 text-xs text-primary-foreground/60
              '>
                <CalendarIcon class='size-3.5' />
                <span class='text-ellipsis'>{df.format(t.due_date)}</span>
              </div>
            {/if}
          </div>
          <div class={['h-2 w-2 shrink-0 rounded-full', getPriorityColor(t.priority)]}></div>
        </div>
      </div>
    </Card.Content>
  </Card.Root>
{/snippet}
