<script lang='ts'>
  import type { ComponentProps } from 'svelte'
  import * as IG from '$lib/components/ui/input-group'
  import Eye from '@lucide/svelte/icons/eye'
  import EyeOff from '@lucide/svelte/icons/eye-off'

  type PasswordInputProps = ComponentProps<typeof IG.Input>

  let {
    class: className,
    value = $bindable<string>(),
    type,
    ...rest
  }: PasswordInputProps = $props()

  let showPassword = $state(false)

  function toggleShowPassword() {
    showPassword = !showPassword
  }
</script>

<IG.Root class={className}>
  <IG.Input
    bind:value={value}
    {...rest}
    type={showPassword ? 'text' : type as any}
  />
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
</IG.Root>
