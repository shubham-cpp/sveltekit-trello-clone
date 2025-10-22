<script lang='ts'>
  import type { PageProps } from './$types'
  import { boardDetails } from '$lib/states/navbar-board-details.svelte'
  import BoardIdHeading from './_components/board-id-heading.svelte'

  const { data }: PageProps = $props()

  $effect(() => {
    if (data.board.title)
      boardDetails.title = data.board.title
  })
</script>

<div>
  <!-- STATS -->
  <BoardIdHeading board={data.board} form={data.form} />
</div>
