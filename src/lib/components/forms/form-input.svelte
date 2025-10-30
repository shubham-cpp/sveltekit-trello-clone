<script lang='ts' generics="T">
  import type { RemoteFormField } from '@sveltejs/kit'
  import type { ComponentProps, Snippet } from 'svelte'
  import * as Field from '$ui/field'
  import * as IG from '$ui/input-group'
  import Eye from '@lucide/svelte/icons/eye'
  import EyeOff from '@lucide/svelte/icons/eye-off'

  type BaseInputProps = ComponentProps<typeof IG.Input>
  type Props = BaseInputProps & {
    // @ts-expect-error
    field: RemoteFormField<T>
    label: string
    as?: string | null
    description?: string
    addon?: Snippet
    addonProps?: ComponentProps<typeof IG.Addon>
  }

  const {
    field,
    label,
    as,
    description,
    addon,
    addonProps,
    type = 'text',
    id,
    placeholder,
    class: className,
    ...rest
  }: Props = $props()

  const asName: string | undefined = (as ?? id ?? undefined) ?? undefined

  let showPassword = $state(false)
  const invalid = $derived(!!field.issues()?.length)

  function toggleShowPassword() {
    showPassword = !showPassword
  }

  const inputType = $derived.by((): typeof type => {
    if (type !== 'password')
      return type

    if (showPassword)
      return 'text'
    return 'password'
  })
</script>

<Field.Field aria-invalid={invalid}>
  <Field.Label aria-invalid={invalid} for={id}>
    {label}
  </Field.Label>

  <IG.Root class={className}>
    <IG.Input
      id={id}
      {placeholder}
      {...(field.as(asName! as any) as any)}
      {...rest}
      type={inputType}
    />

    {#if addon}
      <IG.Addon {...addonProps}>
        {@render addon()}
      </IG.Addon>
    {/if}

    {#if type === 'password'}
      <IG.Addon align='inline-end'>
        <IG.Button
          type='button'
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          onclick={toggleShowPassword}
          variant='ghost'
          class='hover:bg-transparent'
        >
          {#if showPassword}
            <EyeOff class='h-4 w-4' />
          {:else}
            <Eye class='h-4 w-4' />
          {/if}
        </IG.Button>
      </IG.Addon>
    {/if}
  </IG.Root>

  {#if description}
    <Field.Description>{description}</Field.Description>
  {/if}

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
