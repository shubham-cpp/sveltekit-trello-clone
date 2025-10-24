<script lang='ts'>
  import type { PageProps } from './$types'
  import { boardDetails } from '$lib/states/navbar-board-details.svelte'
  import BoardColumns from './_components/board-column/board-columns.svelte'
  import BoardIdStatHeading from './_components/board-id-stats-heading.svelte'
  import WorkingDndActionExample from './working-dnd-action-example.svelte'

  const { data }: PageProps = $props()

  $effect(() => {
    if (data.board.title)
      boardDetails.title = data.board.title
  })
</script>

<div>
  <!-- STATS -->
  <BoardIdStatHeading board={data.board} form={data.form} />
  <BoardColumns board={data.board} />
  <!-- <WorkingDndActionExample /> -->
</div>
