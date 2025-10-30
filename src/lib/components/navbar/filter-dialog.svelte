<script lang='ts'>
  import Badge from '$ui/badge/badge.svelte'
  import Button, { buttonVariants } from '$ui/button/button.svelte'
  import * as Dialog from '$ui/dialog/index.js'
  import { boardDetails } from '$lib/states/navbar-board-details.svelte'
  import { cn } from '$lib/utils'
  import FunnelIcon from '@lucide/svelte/icons/funnel'
  import { SvelteSet } from 'svelte/reactivity'

  let dialogOpen = $state(false)

  const priorities = new SvelteSet<string>()
</script>

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Trigger
    class={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'cursor-pointer')}
    aria-label='Apply Filter'
    title='Apply Filter'
  >
    <FunnelIcon />
    <span class='
      hidden
      sm:inline
    '>Filter</span>
    {#if boardDetails.filterCount > 0}
      <Badge variant='secondary'>{boardDetails.filterCount}</Badge>
    {/if}
  </Dialog.Trigger>

  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Filters</Dialog.Title>
      <Dialog.Description>Filter tasks by priority, assignee or due date</Dialog.Description>
    </Dialog.Header>
    <form action="" method='get' class='space-y-4'>
      <fieldset class='flex items-center space-x-2'>
        <legend>Priority</legend>
        {#each ['Low', 'Medium', 'High'] as pr (pr)}
          <Button
            type='button'
            variant={priorities.has(pr) ? 'default' : 'outline'}
            id={`priority-item-${pr}`}
            onclick={() => {
              if (priorities.has(pr)) {
                // eslint-disable-next-line drizzle/enforce-delete-with-where
                priorities.delete(pr)
              }
              else {
                priorities.add(pr)
              }
            }}
          >{pr}</Button
          >
        {/each}
      </fieldset>
      <fieldset class='flex items-center space-x-2'>
        <legend>Assignee</legend>
        <p>TODO: add assignee fetch call and other things</p>
      </fieldset>
      <div class='flex items-center justify-between gap-2 pt-2'>
        <Button type='reset' variant='destructive'>Clear Filter</Button>
        <div class='flex items-center gap-2'>
          <Dialog.Close type='button' class={buttonVariants({ variant: 'outline' })}>
            Cancel
          </Dialog.Close>
          <Button type='submit'>Apply</Button>
        </div>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
