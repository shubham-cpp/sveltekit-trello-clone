<script lang='ts'>
  import type { ButtonProps } from '$ui/button/button.svelte'

  import FormInput from '$lib/components/forms/form-input.svelte'
  import FormSelect from '$lib/components/forms/form-select.svelte'
  import { Button, buttonVariants } from '$ui/button'
  import { Calendar } from '$ui/calendar'
  import * as Command from '$ui/command/index.js'
  import * as Dialog from '$ui/dialog'
  import * as Field from '$ui/field'
  import * as Popover from '$ui/popover'
  import { Textarea } from '$ui/textarea'
  import { cn, df } from '$lib/utils'
  import { addNewTaskSchema, PRIORITY_VALUES } from '$lib/zod-schemas'

  import {
    CalendarDate,
    getLocalTimeZone,
    parseDate,
    today,
  } from '@internationalized/date'
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import CheckIcon from '@lucide/svelte/icons/check'
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down'
  import PlusIcon from '@lucide/svelte/icons/plus'
  import UserIcon from '@lucide/svelte/icons/user'
  import { useDebounce } from 'runed'
  import { tick } from 'svelte'
  import { toast } from 'svelte-sonner'
  import { createTask, searchOrganizationMembers } from '../data.remote'

  interface AddNewTaskFormProps
    extends Pick<ButtonProps, 'class' | 'variant'> {
    targetColumnId: string
  }
  const todayDate = today(getLocalTimeZone())

  let dialogOpen = $state(false)
  let calenderOpen = $state(false)
  let assigneePopoverOpen = $state(false)
  let searchQuery = $state('')
  let searchResults = $state<Array<{ id: string, name: string, email: string, image: string | null, role: string }>>([])
  let isSearching = $state(false)
  let selectedAssignee = $state<{ id: string, name: string, email: string, image: string | null, role: string } | null>(null)
  let assigneeTriggerRef = $state<HTMLButtonElement | null>(null)

  const { targetColumnId, class: className, variant }: AddNewTaskFormProps = $props()
  const formData = createTask.fields

  let due_date = $state(
    !formData.due_date?.value()
      ? undefined
      : parseDate(
        new Date(formData.due_date.value())
          .toISOString()
          .split('T')[0],
      ),
  )

  const debouncedSearch = useDebounce(
    async () => {
      if (!searchQuery.trim()) {
        searchResults = []
        return
      }

      isSearching = true
      try {
        const results = await searchOrganizationMembers({ query: searchQuery })
        if (Array.isArray(results)) {
          searchResults = results
        }
        else {
          searchResults = []
        }
      }
      catch (error) {
        console.error('Error searching members:', error)
        searchResults = []
      }
      finally {
        isSearching = false
      }
    },
    () => 300, // 300ms debounce delay
  )

  function handleSearch() {
    debouncedSearch()
  }

  function selectAssignee(member: { id: string, name: string, email: string, image: string | null, role: string }) {
    selectedAssignee = member
    formData.assignee.set(member.id)
    assigneePopoverOpen = false
    searchQuery = ''
    searchResults = []
  }

  $effect(() => {
    if (createTask.result?.status === 201) {
      dialogOpen = false
      due_date = undefined
      toast.success((createTask.result as any)?.message || 'New task created successfully.')
    }
  })
</script>

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Trigger
    class={cn(buttonVariants({ variant }), `cursor-pointer`, className)}
    aria-label='Add new task'
  >
    <PlusIcon />
    <span>Add</span>
    <span
      class='
        -ml-1 hidden
        sm:inline
      '>Task</span
    >
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Create New Task</Dialog.Title>
      <Dialog.Description>Add new task to the board</Dialog.Description>
    </Dialog.Header>
    <form
      {...createTask.preflight(addNewTaskSchema)}
      oninput={() => createTask.validate()}
      class='space-y-4'
    >
      <FormInput
        field={formData.title}
        id='title'
        label='Title'
        placeholder='New Task name'
        type='text'
        as='text'
        class='placeholder:text-foreground/50'
      />
      <Field.Field aria-invalid={!!formData.description.issues()?.length}>
        <Field.Label
          aria-invalid={!!formData.description.issues()?.length}
          for='description'>Description</Field.Label
        >
        <Textarea
          {...formData.description.as('text')}
          id='description'
          placeholder='A detailed description about task with its acceptance criteria'
          aria-invalid={!!formData.description.issues()?.length}
          class='placeholder:text-foreground/50'
        />

        <Field.Error
          class='
            hidden
            aria-invalid:block
          '
          aria-invalid={!!formData.description.issues()?.length}
        >
          {formData.description
            .issues()
            ?.map(i => i.message)
            ?.join(',')}
        </Field.Error>
      </Field.Field>
      <div
        class='
          grid gap-x-4 gap-y-2
          sm:grid-cols-2
        '
      >
        <Field.Field
          aria-invalid={!!formData.assignee.issues()?.length}
        >
          <Field.Label
            aria-invalid={!!formData.assignee.issues()?.length}
            for='assignee'>Assignee</Field.Label
          >

          <Popover.Root bind:open={assigneePopoverOpen}>
            <Popover.Trigger bind:ref={assigneeTriggerRef}>
              {#snippet child({ props })}
                <Button
                  variant='outline'
                  class='w-full justify-between'
                  {...props}
                  role='combobox'
                  aria-expanded={assigneePopoverOpen}
                  aria-invalid={!!formData.assignee.issues()?.length}
                >
                  {#if selectedAssignee}
                    <span class='flex items-center gap-2'>
                      {#if selectedAssignee.image}
                        <img
                          src={selectedAssignee.image || ''}
                          alt={selectedAssignee.name}
                          class='size-5 rounded-full'
                        />
                      {:else}
                        <UserIcon class='size-4' />
                      {/if}
                      <span>{selectedAssignee.name}</span>
                    </span>
                  {:else}
                    <span class='text-foreground/50'>Search for a team member</span>
                  {/if}
                  <ChevronsUpDownIcon class='ml-2 size-4 shrink-0 opacity-50' />
                </Button>
              {/snippet}
            </Popover.Trigger>

            <Popover.Content class='w-[320px] p-0'>
              <Command.Root>
                <Command.Input
                  placeholder='Search members...'
                  oninput={(e) => {
                    const target = e.currentTarget as HTMLInputElement
                    searchQuery = target.value
                    handleSearch()
                  }}
                />
                <Command.List>
                  <Command.Empty>
                    {isSearching ? 'Searching...' : 'No members found.'}
                  </Command.Empty>
                  <Command.Group>
                    {#each searchResults as member}
                      <Command.Item
                        value={member.id}
                        onSelect={() => {
                          selectAssignee(member)
                          assigneePopoverOpen = false
                          tick().then(() => assigneeTriggerRef?.focus?.())
                        }}
                      >
                        <CheckIcon
                          class={cn(
                            'mr-2 size-4',
                            formData.assignee.value() !== member.id && `
                              text-transparent
                            `,
                          )}
                        />
                        {#if member.image}
                          <img src={member.image || ''} alt={member.name} class='
                            mr-2 h-5 w-5 rounded-full
                          ' />
                        {:else}
                          <UserIcon class='mr-2 h-4 w-4' />
                        {/if}
                        <span>{member.name}</span>
                        <span class='ml-2 text-xs text-foreground/60'>{member.email}</span>
                      </Command.Item>
                    {/each}
                  </Command.Group>
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>

          <input {...formData.assignee.as('text')} id='assignee' hidden />

          <Field.Error
            class='
              hidden
              aria-invalid:block
            '
            aria-invalid={!!formData.assignee.issues()?.length}
          >
            {formData.assignee
              .issues()
              ?.map(i => i.message)
              ?.join(',')}
          </Field.Error>
        </Field.Field>
        <FormSelect
          field={formData.priority}
          id='priority'
          label='Priority'
          placeholder='select priority'
          items={PRIORITY_VALUES}
          class='capitalize'
        />
      </div>
      <Field.Field aria-invalid={!!formData.due_date.issues()?.length}>
        <Field.Label
          aria-invalid={!!formData.due_date.issues()?.length}
          for='due_date'>Due Date</Field.Label
        >
        <Popover.Root bind:open={calenderOpen}>
          <Popover.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant='outline'
                class={cn(
                  'w-48 justify-between font-normal',
                  !due_date && `text-foreground/60`,
                )}
              >
                {due_date
                  ? df.format(
                    due_date.toDate(getLocalTimeZone()),
                  )
                  : 'Select date'}
                <CalendarIcon />
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content
            class='w-auto overflow-hidden p-0'
            align='start'
          >
            <Calendar
              id='due_date'
              type='single'
              bind:value={due_date}
              captionLayout='dropdown'
              onValueChange={(v) => {
                if (v)
                  formData.due_date.set(v.toString())
                calenderOpen = false
              }}
              minValue={today(getLocalTimeZone())}
              maxValue={new CalendarDate(
                todayDate.year + 1,
                todayDate.month,
                todayDate.day,
              )}
              calendarLabel='Due Date'
            />
          </Popover.Content>
        </Popover.Root>
        <input {...formData.due_date.as('date')} hidden />
        <Field.Error
          class='
            hidden
            aria-invalid:block
          '
          aria-invalid={!!formData.due_date.issues()?.length}
        >
          {formData.due_date
            .issues()
            ?.map(i => i.message)
            ?.join(',')}
        </Field.Error>
      </Field.Field>

      <input
        type='hidden'
        id='targetColumnId'
        name='targetColumnId'
        value={targetColumnId}
      />

      <Button type='submit'>Save changes</Button>
    </form>
  </Dialog.Content>
</Dialog.Root>
