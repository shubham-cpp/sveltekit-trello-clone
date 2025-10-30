<script lang='ts'>
  import type { Board } from '$db/types'
  import type { ViewMode } from '$lib/utils'
  import Badge from '$ui/badge/badge.svelte'
  import * as Card from '$ui/card/index.js'
  import { cn } from '$lib/utils'
  import { DateFormatter } from '@internationalized/date'
  import PlusIcon from '@lucide/svelte/icons/plus'

  interface BoardListProps {
    formId: string
    boards: Board[]
    viewMode: ViewMode
  }
  // TODO: use the `viewMode` prop and implement a table like view for  viewMode == "list"
  const { boards, formId }: BoardListProps = $props()

  // const df = new DateFormatter('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
  const df = new DateFormatter('en-IN', { dateStyle: 'medium' })
</script>

<section>
  <ul class='
    grid grid-cols-1 gap-4
    sm:grid-cols-2 sm:gap-6
    lg:grid-cols-3
    xl:grid-cols-4
  '>
    {#each boards as board (board.id)}
      <li>
        <a href={`/boards/${board.id}`}>
          <Card.Root class='
            group h-full justify-between transition-shadow
            hover:shadow-lg
          '>
            <Card.Header>
              <div class='flex items-center justify-between'>
                <div class={cn('h-4 w-4 rounded', board.color)}></div>
                <Badge class='text-xs' variant='secondary'>New</Badge>
              </div>
              <Card.Title class='
                transition-colors
                group-hover:text-blue-400
                sm:text-lg
              '
              >
                {board.title}
              </Card.Title>
              <Card.Description>{board.description}</Card.Description>
            </Card.Header>
            <Card.Content class='
              flex items-center justify-between gap-1 space-y-1 text-xs
              text-primary-foreground/70
              sm:space-y-0
            '>
              <span>Create: {df.format(new Date(board.createdAt))}</span>
              <span>Updated: {df.format(new Date(board.updatedAt))}</span>
            </Card.Content>
          </Card.Root>
        </a>
      </li>
    {:else}
      <li>No Data found</li>
    {/each}
    <li class='h-full'>
      <button class='h-full w-full' type='submit' form={formId}>
        <Card.Root
          class='
            group h-full cursor-pointer border-2 border-dashed border-border
            transition-colors
            hover:border-primary hover:shadow-lg
          '
        >
          <Card.Content class='
            flex h-full flex-col items-center justify-center p-4
            sm:p-6
          '>
            <PlusIcon class='
              mb-2 size-6
              group-hover:text-primary
              sm:size-8
            ' />
            <p class='
              font-medium
              group-hover:text-primary
            '>Create new board</p>
          </Card.Content>
        </Card.Root>
      </button>
    </li>
  </ul>
</section>
