<script lang='ts'>
  import type { AddNewTaskSchema } from '$lib/zod-schemas'
  import type { DateValue } from '@internationalized/date'
  import type { SuperValidated } from 'sveltekit-superforms'
  import { buttonVariants } from '$lib/components/ui/button'
  import Button from '$lib/components/ui/button/button.svelte'
  import { Calendar } from '$lib/components/ui/calendar/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import { Input } from '$lib/components/ui/input'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import { Textarea } from '$lib/components/ui/textarea'
  import { cn } from '$lib/utils'
  import { addNewTaskSchema, PRIORITY_VALUES } from '$lib/zod-schemas'
  import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import PlusIcon from '@lucide/svelte/icons/plus'
  import { toast } from 'svelte-sonner'
  import { superForm } from 'sveltekit-superforms'
  import { zod4Client as zodClient } from 'sveltekit-superforms/adapters'

  interface AddNewTaskFormProps {
    form: SuperValidated<AddNewTaskSchema>
  }
  const formId = 'add-new-task-form'
  const df = new DateFormatter('en-IN', { dateStyle: 'long' })
  const todayDate = today(getLocalTimeZone())

  let dialogOpen = $state(false)
  let calenderOpen = $state(false)

  const { form: formProps }: AddNewTaskFormProps = $props()
  const form = superForm(formProps, {
    validators: zodClient(addNewTaskSchema),
    onUpdated({ form }) {
      if (form.valid) {
        dialogOpen = false
        toast.success('Task created successfully.')
      }
    },
  })

  const { form: formData, enhance } = form

  let due_date = $state(
    !$formData.due_date
      ? undefined
      : parseDate(new Date($formData.due_date).toISOString().split('T')[0]),
  )

  let placeholder = $state<DateValue>(todayDate)
</script>

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Trigger
    class={cn(buttonVariants(), `cursor-pointer`)}
    aria-label='Add new task'
  >
    <PlusIcon />
    <span>Add</span>
    <span class='
      -ml-1 hidden
      sm:inline
    '>Task</span>

  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Create New Task</Dialog.Title>
      <Dialog.Description>Add new task to the board</Dialog.Description>
    </Dialog.Header>
    <form use:enhance action='?/addNewTask' method='post' id={formId} class='
      space-y-4
    '>
      <Form.Field {form} name='title'>
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Title</Form.Label>
            <Input {...props} placeholder='E.g: Implement a feature' bind:value={$formData.title} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
      <Form.Field {form} name='description'>
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Description</Form.Label>
            <Textarea {...props} placeholder='A detailed description about task with its acceptance criteria' bind:value={$formData.description} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
      <div class='
        grid gap-x-4 gap-y-2
        sm:grid-cols-2
      '>
        <Form.Field {form} name='assignee'>
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Assignee</Form.Label>
              <Input {...props} placeholder='Who should do this?' bind:value={$formData.assignee} />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
        <Form.Field {form} name='priority'>
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Priority</Form.Label>
              <Select.Root
                type='single'
                bind:value={$formData.priority}
                name={props.name}
              >
                <Select.Trigger {...props} class='capitalize'>
                  {$formData.priority
                    ? $formData.priority
                    : 'Select a priority of task'}
                </Select.Trigger>
                <Select.Content>
                  {#each PRIORITY_VALUES as prs (prs)}
                    <Select.Item value={prs} label={prs} class='capitalize' />
                  {/each}
                </Select.Content>
              </Select.Root>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
      </div>
      <Form.Field {form} name='due_date'>
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Due Date</Form.Label>
            <Popover.Root bind:open={calenderOpen}>
              <Popover.Trigger
                {...props}
                class={cn(
                  buttonVariants({ variant: 'outline' }),
                  'w-[280px] justify-start pl-4 text-left font-normal',
                  !due_date && 'text-muted-foreground',
                )}
              >
                {due_date
                  ? df.format(due_date.toDate(getLocalTimeZone()))
                  : 'Pick a date'}
                <CalendarIcon class='ml-auto size-4 opacity-50' />
              </Popover.Trigger>
              <Popover.Content class='w-auto p-0' side='top'>
                <Calendar
                  type='single'
                  value={due_date as DateValue}
                  bind:placeholder
                  captionLayout='dropdown'
                  minValue={today(getLocalTimeZone())}
                  maxValue={new CalendarDate(todayDate.year + 1, todayDate.month, todayDate.day)}
                  calendarLabel='Due Date'
                  onValueChange={(v) => {
                    if (v) {
                      // due_date = new CalendarDate(`${v.year}-${v.month}-${v.day}`)
                      due_date = new CalendarDate(v.year, v.month, v.day)
                      $formData.due_date = v.toDate(getLocalTimeZone())
                      calenderOpen = false
                    }
                  }}
                />
              </Popover.Content>
            </Popover.Root>
            <Form.Description>
              By when should task finish
            </Form.Description>
            <Form.FieldErrors />
            <input hidden value={$formData.due_date} name={props.name} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    </form>
    <Dialog.Footer>
      <Button type='submit' form={formId}>Save changes</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
