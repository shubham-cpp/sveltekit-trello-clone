<script lang='ts'>
  import { page } from '$app/state'
  import GoogleSignInButton from '$lib/components/navbar/google-sign-in-button.svelte'
  import Logo from '$lib/components/navbar/logo.svelte'
  import { buttonVariants } from '$lib/components/ui/button'
  import { cn } from '$lib/utils'

  const isLoginRoute = $derived(page.url.pathname === '/login')

  const { children } = $props()
</script>

<section class='
  flex min-h-screen bg-zinc-50 px-4 py-16
  md:py-32
  dark:bg-transparent
'>
  <div
    class='
      m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border
      bg-card p-0.5 shadow-md
      dark:[--color-muted:var(--color-zinc-900)]
    '
  >
    <div class='p-8 pb-6'>
      <Logo />
      <div>
        <h1 class='mt-4 mb-1 text-xl font-semibold'>
          {#if isLoginRoute}
            Sign In to TailFlow
          {:else}
            Create a TailFlow Account
          {/if}
        </h1>
        <p class='text-sm'>
          {#if isLoginRoute}
            Welcome back! Sign in to continue
          {:else}
            Welcome! Create an account to get started
          {/if}
        </p>
      </div>

      <div class='mt-6'>
        <GoogleSignInButton />
      </div>

      <hr class='my-4 border-dashed' />
      {@render children?.()}
    </div>

    <div class='rounded-(--radius) border bg-muted p-3'>
      <p class='text-center text-sm text-accent-foreground'>
        {#if isLoginRoute}
          Don&apos;t have an account ?

          <a class={cn(buttonVariants({ variant: 'link' }), 'px-1')} href='/sign-up'
          >Create account</a
          >
        {:else}
          Have an account ?
          <a class={cn(buttonVariants({ variant: 'link' }), 'px-1')} href='/login'>Login</a>
        {/if}
      </p>
    </div>
  </div>
</section>
