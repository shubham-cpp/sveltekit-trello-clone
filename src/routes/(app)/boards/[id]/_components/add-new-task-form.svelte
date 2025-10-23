<script lang='ts'>
  import type { ButtonProps } from '$lib/components/ui/button/button.svelte'

  import { buttonVariants } from '$lib/components/ui/button'
  import Button from '$lib/components/ui/button/button.svelte'
  import { Calendar } from '$lib/components/ui/calendar/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Field from '$lib/components/ui/field/index.js'
  import { Input } from '$lib/components/ui/input'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import { Textarea } from '$lib/components/ui/textarea'
  import { cn } from '$lib/utils'
  import { addNewTaskSchema, PRIORITY_VALUES } from '$lib/zod-schemas'
  import {
    CalendarDate,
    DateFormatter,
    getLocalTimeZone,
    parseDate,
    today,
  } from '@internationalized/date'

  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import PlusIcon from '@lucide/svelte/icons/plus'
  import { toast } from 'svelte-sonner'
  import { createTask } from '../data.remote'

  interface AddNewTaskFormProps extends Pick<ButtonProps, 'class' | 'variant'> {
    targetColumnId: string
  }
  const df = new DateFormatter('en-IN', { dateStyle: 'long' })
  const todayDate = today(getLocalTimeZone())

  let dialogOpen = $state(false)
  let calenderOpen = $state(false)

  const { targetColumnId, class: className, variant }: AddNewTaskFormProps = $props()
  const formData = createTask.fields

  let due_date = $state(
    !formData.due_date?.value()
      ? undefined
      : parseDate(
        new Date(formData.due_date.value()).toISOString().split('T')[0],
      ),
  )

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
        <Field.Field aria-invalid={!!formData.assignee.issues()?.length}>
          <Field.Label
            aria-invalid={!!formData.assignee.issues()?.length}
            for='assignee'>Assignee</Field.Label
          >
          <Input
            {...formData.assignee.as('text')}
            id='assignee'
            placeholder='Who should work on this?'
            aria-invalid={!!formData.assignee.issues()?.length}
            class='placeholder:text-foreground/50'
          />

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
        <Field.Field aria-invalid={!!formData.priority.issues()?.length}>
          <Field.Label
            aria-invalid={!!formData.priority.issues()?.length}
            for='priority'>Priority</Field.Label
          >
          <Select.Root
            type='single'
            onValueChange={newV => formData.priority.set(newV as any)}
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
                  ? df.format(due_date.toDate(getLocalTimeZone()))
                  : 'Select date'}
                <CalendarIcon />
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content class='w-auto overflow-hidden p-0' align='start'>
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
        <input {...formData.due_date.as('date')} hidden>
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
