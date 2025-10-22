<script lang='ts'>
  import type { Board } from '$lib/server/db/types'
  import * as Card from '$lib/components/ui/card/index.js'
  import ChartNoAxesCombines from '@lucide/svelte/icons/chart-no-axes-combined'
  import Trello from '@lucide/svelte/icons/trello'

  const { boards }: { boards: Board[] } = $props()

  const recentActivities = $derived.by(() => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return boards.filter((b) => {
      const updatedAt = new Date(b.updatedAt)
      return updatedAt > oneWeekAgo
    }).length
  })
</script>

<section class='
  mb-6 grid grid-cols-2 gap-4 p-4
  sm:mb-8 sm:gap-6
  lg:grid-cols-4
'>
  <Card.Root>
    <Card.Content class='
      px-4
      sm:px-6
    '>
      <div class='flex items-center justify-between'>
        <div>
          <p class='
            text-xs font-medium text-primary-foreground/70
            sm:text-sm
          '>Total Boards</p>
          <p class='
            text-xl font-bold
            sm:text-2xl
          '>{boards.length}</p>
        </div>
        <div
          class='
            flex size-10 items-center justify-center rounded-lg bg-blue-100
            sm:size-12
            dark:bg-cyan-600
          '
        >
          <Trello class='
            size-6 text-blue-600
            sm:size-7
            dark:text-blue-200
          ' />
        </div>
      </div>
    </Card.Content>
  </Card.Root>
  <Card.Root>
    <Card.Content class='
      px-4
      sm:px-6
    '>
      <div class='flex items-center justify-between'>
        <div>
          <p class='
            text-xs font-medium text-primary-foreground/70
            sm:text-sm
          '>Recent Activity</p>
          <p class='
            text-xl font-bold
            sm:text-2xl
          '>{recentActivities}</p>
        </div>
        <div
          class='
            flex size-10 items-center justify-center rounded-lg bg-purple-100
            sm:size-12
            dark:bg-purple-600
          '
        >
          <ChartNoAxesCombines class='
            size-6 text-purple-600
            sm:size-7
            dark:text-purple-200
          ' />
        </div>
      </div>
    </Card.Content>
  </Card.Root>
</section>
