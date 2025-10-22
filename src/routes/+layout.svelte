<script lang='ts'>
  import favicon from '$lib/assets/favicon.svg'
  import { Toaster } from '$lib/components/ui/sonner'
  import { ModeWatcher } from 'mode-watcher'
  import '../app.css'

  const { children } = $props()
</script>

<svelte:head>
  <link rel='icon' href={favicon} />
  <meta
    name='description'
    content='A Jira-Clone app build with SvelteKit, Better-Auth and Drizzle'
  />
  <meta name='author' content='Shubham Pawar(https://github.com/shubham-cpp)' />
</svelte:head>
<ModeWatcher />
<Toaster richColors />
{@render children?.()}
