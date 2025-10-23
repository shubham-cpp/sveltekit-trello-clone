<script lang='ts'>
  import type { BoardColumnWithTask, BoardWithColumnAndTask } from '$lib/server/db/types'
  import Badge from '$lib/components/ui/badge/badge.svelte'
  import Button from '$lib/components/ui/button/button.svelte'
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis'

  interface BoardColumnsProps {
    board: BoardWithColumnAndTask
  }

  const { board }: BoardColumnsProps = $props()
</script>

<div>
  {#each board.columns as col (col.id)}
    {@render column(col)}
  {/each}
</div>

{#snippet column(col: BoardColumnWithTask)}
  <div class='
    w-full
    lg:w-80 lg:shrink-0
  '>
    <div class='
      bg-neutral-100
      dark:bg-neutral-900
    '>
      <!-- Header -->
      <div class='
        border-b p-3
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
          <Button class='shrink-0' size='icon-sm' variant='outline'> <EllipsisIcon /> </Button>
        </div>
      </div>
      <!-- Task List -->
      <div class="p-2"></div>
    </div>
  </div>
{/snippet}
