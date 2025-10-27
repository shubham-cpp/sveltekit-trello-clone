<script lang='ts'>
  import type { PageProps } from './$types'
  import TrashItem from './_components/trash-item.svelte'

  const { data }: PageProps = $props()
</script>

<section class='
  space-y-4 p-4
  sm:p-6
'>
  <header>
    <h1 class='text-2xl font-semibold'>Trashed boards</h1>
    <p class='text-sm text-foreground/70'>
      Restore boards you've deleted recently or remove them permanently.
    </p>
  </header>

  {#if data.boards.length === 0}
    <div class='rounded-md border p-6 text-center text-foreground/60'>
      No deleted boards found.
    </div>
  {:else}
    <div class='
      grid gap-3
      sm:gap-4
    '>
      {#each data.boards as b (b.id)}
        <TrashItem board={b} />
      {/each}
    </div>
  {/if}
</section>
