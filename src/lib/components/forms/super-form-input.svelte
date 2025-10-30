<script lang='ts' module>
  type T = Record<string, unknown>
</script>

<script lang='ts' generics="T extends Record<string, unknown>">
  import type { ComponentProps } from 'svelte'

  import type { FormPathLeaves, SuperForm } from 'sveltekit-superforms'
  import * as Field from '$ui/field'
  import Input from '$ui/input/input.svelte'
  import { formFieldProxy } from 'sveltekit-superforms'

  type Props = ComponentProps<typeof Input> & {
    label: string
    description?: string
    superform: SuperForm<T>
    field: FormPathLeaves<T>
  }

  const { superform: form, field, label, description, ...rest }: Props = $props()

  const { value, errors } = formFieldProxy(form, field)

  const inputProps = $derived.by(() => ({
    id: field,
    name: field,
    ...(rest),
  }))
</script>

<Field.Field data-invalid={$errors ? true : undefined}>
  <Field.Label for={inputProps.id}>
    {label}
  </Field.Label>

  <Input
    {...inputProps}
    aria-invalid={$errors ? 'true' : undefined}
    bind:value={$value}
  />

  {#if description}
    <Field.Description>{description}</Field.Description>
  {/if}

  {#if $errors?.length}
    <Field.Error>
      {$errors.join(' ')}
    </Field.Error>
  {/if}
</Field.Field>
