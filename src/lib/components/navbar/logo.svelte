<script lang='ts'>
  import { authClient } from '$lib/auth-client'
  import TrelloIcon from '@lucide/svelte/icons/trello'

  const session = authClient.useSession()
  const isLoggedIn = $derived($session.data?.user.id)
</script>

<a href={isLoggedIn ? '/dashboard' : '/'}
   aria-label={isLoggedIn ? 'go to dashboard' : 'go to home'}
   class='flex items-center gap-x-2'>
  <TrelloIcon class='
    size-8 text-green-600
    dark:text-green-500
  ' aria-label='logo icon' />
  <h1 class='
    hidden text-xl font-bold
    sm:block sm:text-2xl
  '>Trello Clone</h1>
</a>
