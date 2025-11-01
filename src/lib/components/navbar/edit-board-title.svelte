<script lang='ts'>
  import type { SubmitFunction } from '@sveltejs/kit'
  import { enhance } from '$app/forms'
  import { boardDetails } from '$lib/states/navbar-board-details.svelte'
  import { cn } from '$lib/utils'
  import { COLOR_VALUES } from '$lib/zod-schemas'
  import { Button, buttonVariants } from '$ui/button'
  import * as Dialog from '$ui/dialog/index.js'
  import { Input } from '$ui/input/index.js'
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis'
  import { tick } from 'svelte'
  import DeleteDashboardSection from './delete-dashboard-section.svelte'

  let title = $state(boardDetails.title ?? '')
  let color = $state(boardDetails.color ?? COLOR_VALUES[0])
  let dialogOpen = $state(false)

  $effect(() => {
    title = boardDetails.title ?? ''
    color = boardDetails.color ?? COLOR_VALUES[0]
  })

  $effect(() => {
    if (dialogOpen) {
      tick().then(() => document.getElementById('title')?.focus())
    }
  })

  const isBoardNotUpdated = $derived(
    title.trim() === (boardDetails.title ?? '').trim()
      && color === ((boardDetails as any).color ?? COLOR_VALUES[0]),
  )

  const handleEnhance: SubmitFunction = () => {
    return async ({ update, result }) => {
      if (result.type === 'success') {
        await update()
        dialogOpen = false
      }
    }
  }
</script>

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Trigger
    class={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), !title?.trim() && `
      hidden
    `)}
    aria-label='Edit board'
    title='Edit Board'
  >
    <EllipsisIcon />
  </Dialog.Trigger>

  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Edit board</Dialog.Title>
      <Dialog.Description>Change the board title and color</Dialog.Description>
    </Dialog.Header>

    <form method='POST' action='?/updateBoard' use:enhance={handleEnhance} class='
      space-y-4
    '>
      <div>
        <label for='title' class='block text-sm font-medium'>Title</label>
        <Input id='title' name='title' bind:value={title} class='mt-1 w-full' />
      </div>

      <div>
        <label class='block text-sm font-medium'>Color</label>
        <div class='mt-2 grid grid-cols-4 gap-2'>
          {#each COLOR_VALUES as c, i}
            <label for={`color-${i}`} class='
              flex cursor-pointer items-center justify-center
            '>
              <input
                id={`color-${i}`}
                type='radio'
                name='color'
                value={c}
                class='sr-only'
                bind:group={color}
              />
              <span
                class={cn(
                  'inline-block h-8 w-8 rounded',
                  c,
                  color === c && 'ring-2 ring-indigo-500 ring-offset-2',
                )}
              ></span>
            </label>
          {/each}
        </div>
      </div>

      <div class='flex items-center justify-end gap-2 pt-2'>
        <Dialog.Close type='button' class={buttonVariants({ variant: 'outline' })}
        >
          Cancel
        </Dialog.Close>
        <Button type='submit' disabled={isBoardNotUpdated}>Save</Button>
      </div>
    </form>

    <!-- Danger zone: delete board -->
    <DeleteDashboardSection />
  </Dialog.Content>
</Dialog.Root>
