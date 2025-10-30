<script lang='ts'>
  import type { RemoteFormField } from '@sveltejs/kit'
  import type { ComponentProps } from 'svelte'
  import * as Field from '$ui/field'
  import * as Select from '$ui/select'

  type Item = string | { value: string, label?: string }

  type TriggerProps = ComponentProps<typeof Select.Trigger>

  type Props = TriggerProps & {
    field: RemoteFormField<string>
    label: string
    id?: string
    placeholder?: string
    items: ReadonlyArray<Item>
  }

  const {
    field,
    label,
    id,
    placeholder = 'Select...',
    items,
    class: className,
    ...triggerRest
  }: Props = $props()

  const invalid = $derived(!!field.issues()?.length)

  function asValue(it: Item) {
    return typeof it === 'string' ? it : it.value
  }
  function asLabel(it: Item) {
    return typeof it === 'string' ? it : it.label ?? it.value
  }

  // derive current selected label for trigger text
  const selectedText = $derived.by(() => {
    const v = field.value?.()?.trim()
    if (!v)
      return ''
    const found = items.find(i => asValue(i) === v)
    return found ? asLabel(found) : v
  })
</script>

<Field.Field aria-invalid={invalid}>
  <Field.Label aria-invalid={invalid} for={id}>
    {label}
  </Field.Label>

  <Select.Root
    type='single'
    onValueChange={newV => field.set?.(newV)}
  >
    <Select.Trigger
      id={id}
      aria-invalid={invalid}
      class={className}
      {...triggerRest}
    >
      {selectedText || placeholder}
    </Select.Trigger>
    <Select.Content
      {...field.as('select' as any)}
      aria-invalid={invalid}
    >
      {#each items as it (asValue(it))}
        <Select.Item
          id={asValue(it)}
          value={asValue(it)}
          label={asLabel(it)}
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
    aria-invalid={invalid}
  >
    {field.issues()?.map(i => i.message)?.join(',')}
  </Field.Error>
</Field.Field>
