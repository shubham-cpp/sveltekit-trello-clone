<script lang='ts'>
  import type { Board } from '$db/types'
  import * as AlertDialog from '$ui/alert-dialog/index.js'
  import { Button, buttonVariants } from '$ui/button'
  import { df } from '$lib/utils'
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw'
  import TrashIcon from '@lucide/svelte/icons/trash'
  import { toast } from 'svelte-sonner'
  import { deleteBoardForever, restoreBoard } from '../data.remote'

  const { board }: { board: Board } = $props()

  const updatedAt = $derived(
    board.updatedAt ? df.format(new Date(board.updatedAt)) : '—',
  )

  const restore = restoreBoard.for(board.id)
  const del = deleteBoardForever.for(board.id)

  $effect(() => {
    if (restore.result?.status === 204) {
      toast.success((restore.result as any)?.message || 'Board has been restored successfully')
    }
  })

  $effect(() => {
    if (del.result?.status === 204) {
      toast.info((restore.result as any)?.message || 'Board has been deleted successfully')
    }
  })
</script>

<div class='flex items-center justify-between gap-3 rounded-md border p-3'>
  <div class='min-w-0'>
    <div class='truncate font-medium'>{board.title}</div>
    <div class='truncate text-xs text-foreground/60'>
      Updated {updatedAt}
    </div>
  </div>

  <div class='flex shrink-0 items-center gap-2'>
    <!-- Restore dialog -->
    <AlertDialog.Root>
      <AlertDialog.Trigger class={[buttonVariants({ variant: 'outline' }), `
        cursor-pointer
      `]} aria-label='Restore board'>
        <RotateCcwIcon class='size-4' />
        Restore
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Restore this board?</AlertDialog.Title>
          <AlertDialog.Description>
            This will move the board back to your dashboard.
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer class='flex items-center gap-2'>
          <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
          <form {...restore}>
            <input name='boardId' type='hidden' value={board.id} />
            <Button type='submit'>
              <RotateCcwIcon class='size-4' />
              Restore
            </Button>
          </form>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog.Root>

    <!-- Delete forever dialog -->
    <AlertDialog.Root>
      <AlertDialog.Trigger class={[buttonVariants({ variant: 'destructive' }), `
        cursor-pointer
      `]} aria-label='Delete board forever'>
        <TrashIcon class='size-4' />
        Delete forever
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Delete this board permanently?</AlertDialog.Title>
          <AlertDialog.Description>
            This action cannot be undone. This will permanently delete the board
            and all its data.
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer class='flex items-center gap-2'>
          <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
          <form {...del}>
            <input name='boardId' type='hidden' value={board.id} />
            <Button type='submit' variant='destructive'>
              <TrashIcon class='size-4' />
              Delete forever
            </Button>
          </form>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog.Root>
  </div>
</div>
