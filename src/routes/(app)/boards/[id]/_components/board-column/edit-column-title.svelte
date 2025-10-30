<script lang='ts'>
  import FormInput from '$lib/components/forms/form-input.svelte'
  import { Button } from '$ui/button'
  import * as Dialog from '$ui/dialog'
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis'
  import { tick } from 'svelte'
  import { toast } from 'svelte-sonner'
  import { updateColumnTitle } from '../../data.remote'

  interface Props {
    columnId: string
    initialTitle: string
    onSuccess?: (newTitle: string) => void
  }

  const { columnId, initialTitle, onSuccess }: Props = $props()

  let dialogOpen = $state(false)

  $effect(() => {
    if (dialogOpen) {
      updateColumnTitle.fields.columnId.set(columnId)
      updateColumnTitle.fields.title.set(initialTitle)
      tick().then(() => document.getElementById(`col-title-${columnId}`)?.focus())
    }
  })

  const isNotChanged = $derived(updateColumnTitle.fields.title.value()?.trim() === initialTitle?.trim())

  // Watch result and close dialog on success
  // $effect(() => {
  //   if ((updateColumnTitle.result as any)?.success) {
  //   }
  // })
  const handleEnhance: Parameters<typeof updateColumnTitle.enhance>[0] = async ({ data, submit }) => {
    try {
      await submit()
      console.log('in here')
      dialogOpen = false
      onSuccess?.(data.title)
      toast.success('Column title updated.')
    }
    catch {
      toast.error('Unable to update the title.')
    }
  }
</script>

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Trigger
    class='shrink-0'
    aria-label='Edit column'
    title='Edit Column'
  >
    <Button size='icon-sm' variant='outline'><EllipsisIcon /></Button>
  </Dialog.Trigger>

  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Edit column</Dialog.Title>
      <Dialog.Description>Change the column title</Dialog.Description>
    </Dialog.Header>

    <!-- use:enhance={handleEnhance} -->
    <!-- oninput={() => updateColumnTitle.validate()} -->
    <form
      {...updateColumnTitle.enhance(async ({ data, submit }) => {
        try {
          await submit()
          console.log('in here')
          dialogOpen = false
          onSuccess?.(data.title)
          toast.success('Column title updated.')
        }
        catch {
          toast.error('Unable to update the title.')
        }
      })}
      class='space-y-4'
    >
      <input {...updateColumnTitle.fields.columnId.as('hidden', columnId)} hidden />

      <FormInput
        label='Title'
        id={`col-title-${columnId}`}
        field={updateColumnTitle.fields.title}
        as='text'
        placeholder='Enter column title'
      />

      <Dialog.Footer>
        <Dialog.Close type='button' class='rounded-md border px-3 py-2 text-sm'>
          Cancel
        </Dialog.Close>
        <Button {...updateColumnTitle.buttonProps} disabled={isNotChanged}>Save</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
