<script lang='ts'>
  import type { PageProps } from './$types'
  import { boardDetails } from '$lib/states/navbar-board-details.svelte'

  const { data }: PageProps = $props()

  const totalTasks = $derived.by(() =>
    data.board.columns.reduce((sum, col) => sum + col.tasks.length, 0),
  )

  $effect(() => {
    if (data.board.title)
      boardDetails.title = data.board.title
  })
</script>

<h1>Board : {data.board.title}</h1>
<!-- Stats -->
<div>
  <div>
    <div>
      <span>Total Tasks: {totalTasks} </span>
    </div>
  </div>
</div>
