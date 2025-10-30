<script lang='ts'>
  import type { User } from 'better-auth'
  import { Button, buttonVariants } from '$ui/button'
  import * as Dialog from '$ui/dialog/index.js'
  import { Input } from '$ui/input'
  import { cn } from '$lib/utils'
  import PlusIcon from '@lucide/svelte/icons/plus'
  import { useDebounce } from 'runed'
  import { toast } from 'svelte-sonner'
  import { inviteUser, searchUsersToInvite } from '../data.remote'

  let open = $state(false)
  let search = $state('')
  let isSearching = $state(false)
  let results = $state<Array<Pick<User, 'id' | 'name' | 'email' | 'image'>>>([])

  const debouncedSearch = useDebounce(
    async () => {
      const q = search.trim()
      if (!q) {
        results = []
        return
      }
      isSearching = true
      try {
        const r = await searchUsersToInvite({ q })
        results = Array.isArray(r) ? r : []
      }
      catch (e) {
        console.error('invite search error:', e)
        results = []
      }
      finally {
        isSearching = false
      }
    },
    () => 300,
  )

  function onSearchInput() {
    debouncedSearch()
  }

  async function onInvite(email: string) {
    try {
      const res = await inviteUser({ email, role: 'member' })
      if ((res as any)?.status === 201) {
        toast.success('Invitation sent')
        open = false
        search = ''
        results = []
      }
      else if ((res as any)?.error) {
        toast.error((res as any).error)
      }
      else {
        toast.error('Failed to send invite')
      }
    }
    catch (e) {
      console.error(e)
      toast.error('Failed to send invite')
    }
  }
</script>

<Dialog.Root bind:open={open}>
  <Dialog.Trigger class={cn(buttonVariants({ variant: 'outline' }))} aria-label='Invite people'>
    <PlusIcon />
    Invite people
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Invite to workspace</Dialog.Title>
      <Dialog.Description>
        Search for users by name or email. Only non-members are shown.
      </Dialog.Description>
    </Dialog.Header>

    <div class='space-y-3'>
      <div class='flex items-center gap-2'>
        <Input
          placeholder='Search users...'
          bind:value={search}
          oninput={onSearchInput}
        />
      </div>

      <div class='max-h-64 overflow-y-auto rounded-md border'>
        {#if isSearching}
          <p class='p-2 text-center'>Searching...</p>
        {:else if results.length === 0}
          <p class='p-2 text-center text-foreground/60'>
            {search ? 'No users found' : 'Type to search'}
          </p>
        {:else}
          <ul class='divide-y'>
            {#each results as u (u.id)}
              <li class='flex items-center justify-between p-2'>
                <div class='flex items-center gap-2'>
                  {#if u.image}
                    <img src={u.image} alt={u.name} class='size-6 rounded-full' />
                  {:else}
                    <div class='size-6 rounded-full bg-muted'></div>
                  {/if}
                  <div>
                    <div>{u.name}</div>
                    <div class='text-xs text-foreground/60'>{u.email}</div>
                  </div>
                </div>
                <Button size='sm' onclick={() => onInvite(u.email)}>Invite</Button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
