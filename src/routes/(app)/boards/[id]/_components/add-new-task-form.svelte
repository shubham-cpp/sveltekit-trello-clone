<script lang='ts'>
  import type { ButtonProps } from '$lib/components/ui/button/button.svelte'

  import { Button, buttonVariants } from '$lib/components/ui/button'
  import { Calendar } from '$lib/components/ui/calendar'
  import * as Dialog from '$lib/components/ui/dialog'
  import * as Field from '$lib/components/ui/field'
  import * as InputGroup from '$lib/components/ui/input-group'
  import Input from '$lib/components/ui/input/input.svelte'
  import * as Label from '$lib/components/ui/label'
  import * as Popover from '$lib/components/ui/popover'
  import * as Select from '$lib/components/ui/select'
  import { Textarea } from '$lib/components/ui/textarea'
  import { cn, df } from '$lib/utils'
  import { addNewTaskSchema, PRIORITY_VALUES } from '$lib/zod-schemas'

  import {
    CalendarDate,
    getLocalTimeZone,
    parseDate,
    today,
  } from '@internationalized/date'
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import PlusIcon from '@lucide/svelte/icons/plus'
  import SearchIcon from '@lucide/svelte/icons/search'
  import UserIcon from '@lucide/svelte/icons/user'
  import { useDebounce } from 'runed'
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
      <Field.Field aria-invalid={!!formData.title.issues()?.length}>
        <Field.Label
          aria-invalid={!!formData.title.issues()?.length}
          for='title'>Title</Field.Label
        >
        <Input
          {...formData.title.as('text')}
          id='title'
          class='placeholder:text-foreground/50'
          placeholder='New Task name'
          aria-invalid={!!formData.title.issues()?.length}
        />

        <Field.Error
          class='
            hidden
            aria-invalid:block
          '
          aria-invalid={!!formData.title.issues()?.length}
        >
          {formData.title
            .issues()
            ?.map(i => i.message)
            ?.join(',')}
        </Field.Error>
      </Field.Field>
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
            <Popover.Trigger class='w-full'>
              <div
                class='
                  flex h-9 w-full min-w-0 rounded-md border border-input
                  bg-transparent px-3 pt-1.5 text-sm font-medium shadow-xs
                  ring-offset-background transition-[color,box-shadow]
                  outline-none
                  selection:bg-primary selection:text-primary-foreground
                  placeholder:text-muted-foreground
                  focus-visible:border-ring focus-visible:ring-[3px]
                  focus-visible:ring-ring/50
                  disabled:cursor-not-allowed disabled:opacity-50
                  aria-invalid:border-destructive
                  aria-invalid:ring-destructive/20
                  dark:bg-input/30 dark:aria-invalid:ring-destructive/40
                '
                aria-invalid={!!formData.assignee.issues()?.length}
              >
                {#if selectedAssignee}
                  <div class='flex items-center gap-2'>
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
                  </div>
                {:else}
                  <span class='text-foreground/50'>Search for a team member</span>
                {/if}
              </div>
            </Popover.Trigger>

            <Popover.Content class='w-72 p-2'>
              <div class='space-y-2'>
                <!-- <div class='flex items-center gap-2 rounded-md border p-2'>
                  <SearchIcon class='h-4 w-4' />
                  <input
                    bind:value={searchQuery}
                    oninput={handleSearch}
                    placeholder='Search members...'
                    class='flex-1 bg-transparent outline-none'
                  />
                </div> -->
                <InputGroup.Root>
                  <InputGroup.Input
                    id='assignee-search'
                    type='search'
                    placeholder='Search by name...'
                    bind:value={searchQuery}
                    oninput={handleSearch}
                  />
                  <InputGroup.Addon>
                    <Label.Root for='assignee-search'>
                      <SearchIcon class='size-4' />
                    </Label.Root>
                  </InputGroup.Addon>
                </InputGroup.Root>

                <div class='max-h-60 overflow-y-auto'>
                  {#if isSearching}
                    <div class='p-2 text-center'>Searching...</div>
                  {:else if searchResults.length === 0}
                    <div class='p-2 text-center text-foreground/50'>
                      {searchQuery ? 'No members found' : 'Type to search'}
                    </div>
                  {:else}
                    <div class='space-y-1'>
                      {#each searchResults as member}
                        <button
                          type='button'
                          class='
                            flex w-full items-center gap-2 rounded-md p-2
                            text-left
                            hover:bg-muted
                          '
                          onclick={() => selectAssignee(member)}
                        >
                          {#if member.image}
                            <img
                              src={member.image || ''}
                              alt={member.name}
                              class='h-6 w-6 rounded-full'
                            />
                          {:else}
                            <UserIcon class='h-5 w-5' />
                          {/if}
                          <div>
                            <div>{member.name}</div>
                            <div class='text-xs text-foreground/60'>{member.email}</div>
                          </div>
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
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
        <Field.Field
          aria-invalid={!!formData.priority.issues()?.length}
        >
          <Field.Label
            aria-invalid={!!formData.priority.issues()?.length}
            for='priority'>Priority</Field.Label
          >
          <Select.Root
            type='single'
            onValueChange={newV =>
              formData.priority.set(newV as any)}
          >
            <Select.Trigger
              id='department'
              aria-invalid={!!formData.priority.issues()?.length}
              class='capitalize'
            >
              {formData?.priority?.value()?.trim()
                ? formData?.priority?.value()
                : 'select priority'}
            </Select.Trigger>
            <Select.Content
              {...formData.priority.as('select')}
              aria-invalid={!!formData.priority.issues()?.length}
            >
              {#each PRIORITY_VALUES as prs (prs)}
                <Select.Item
                  id={prs}
                  value={prs}
                  label={prs}
                  class='capitalize'
                />
              {/each}
            </Select.Content>
          </Select.Root>
          <Field.Error
            class='
              hidden
              aria-invalid:block
            '
            aria-invalid={!!formData.priority.issues()?.length}
          >
            {formData.priority
              .issues()
              ?.map(i => i.message)
              ?.join(',')}
          </Field.Error>
        </Field.Field>
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
