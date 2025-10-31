<script lang='ts'>
  import type { invitationQueries } from '$db/queries'
  import type { SubmitFunction } from '@sveltejs/kit'
  import { enhance } from '$app/forms'
  import { Button } from '$ui/button'
  import * as Dialog from '$ui/dialog/index.js'
  import CheckIcon from '@lucide/svelte/icons/check'
  import XIcon from '@lucide/svelte/icons/x'
  import { toast } from 'svelte-sonner'
  import { listPendingInvitations, rejectInvitationRequest } from '../data.remote'

  const { count = 0 } = $props<{ count?: number }>()

  type InviteItem = Awaited<ReturnType<typeof invitationQueries.listPendingForUser>>

  let open = $state(false)
  let loading = $state(false)
  let items = $state<InviteItem>([])

  async function refresh() {
    loading = true
    try {
      const res = await listPendingInvitations()
      items = Array.isArray(res) ? res : []
    }
    catch (e) {
      console.error('load invites error:', e)
      toast.error('Failed to load invitations')
      items = []
    }
    finally {
      loading = false
    }
  }

  $effect(() => {
    if (open) {
      refresh()
    }
  })

  async function onReject(id: string) {
    try {
      const res = await rejectInvitationRequest({ invitationId: id })
      if ((res as any)?.success) {
        toast.success('Invitation declined')
        await refresh()
        if (!items.length) {
          open = false
        }
      }
      else if ((res as any)?.error) {
        toast.error((res as any).error)
      }
      else {
        toast.error('Failed to decline invitation')
      }
    }
    catch (e) {
      console.error(e)
      toast.error('Failed to decline invitation')
    }
  }
  const handleEnhance: SubmitFunction = () => {
    return async ({ result, update }) => {
      if (result.type === 'success') {
        toast.success('Invitation accepted')
        await refresh()
        if (!items.length) {
          open = false
        }
        await update()
      }
      else if (result.type === 'failure') {
        const err = (result.data as any)?.error ?? 'Failed to accept invitation'
        toast.error(err)
        await update()
      }
      else if (result.type === 'error') {
        toast.error('Failed to accept invitation')
        await update()
      }
    }
  }
</script>

<Dialog.Root bind:open={open}>
  <Dialog.Trigger class='
    cursor-pointer text-xl font-bold underline underline-offset-4
    sm:text-2xl
  ' aria-label='View pending invitations' title='View pending invitations'>
    {count}
  </Dialog.Trigger>
  <Dialog.Content class='w-[min(90vw,640px)] max-w-[90vw] overflow-x-hidden'>
    <Dialog.Header>
      <Dialog.Title>Pending invitations</Dialog.Title>
      <Dialog.Description>
        View and respond to your pending workspace invitations.
      </Dialog.Description>
    </Dialog.Header>

    {#if loading}
      <p class='p-2 text-center'>Loading...</p>
    {:else if !items.length}
      <p class='p-2 text-center text-foreground/60'>No pending invitations.</p>
    {:else}
      <ul class='
        max-h-80 w-full max-w-full divide-y overflow-x-hidden overflow-y-auto
        rounded-md border
      '>
        {#each items as inv (inv.id)}
          <li class='flex w-full items-center justify-between gap-3 p-3'>
            <div class='flex min-w-0 grow items-center gap-3'>
              {#if inv.organizationLogo}
                <img src={inv.organizationLogo} alt={inv.organizationName} class='
                  size-8 shrink-0 rounded
                ' />
              {:else}
                <div class='size-8 shrink-0 rounded bg-muted'></div>
              {/if}
              <div class='min-w-0'>
                <div class='truncate font-medium'>{inv.organizationName}</div>
                <div class='truncate text-xs text-foreground/60'>
                  Invited by {inv.inviterName || inv.inviterEmail || 'someone'} · Role {inv.role}
                </div>
              </div>
            </div>
            <div class='flex shrink-0 items-center gap-2'>
              <form method='POST' action='?/acceptInvitation' use:enhance={handleEnhance}>
                <input type='hidden' name='invitationId' value={inv.id} />
                <Button size='sm' type='submit' aria-label='Accept invitation'>
                  <CheckIcon class='size-4' />
                  <span class='
                    ml-1 hidden
                    sm:inline
                  '>Accept</span>
                </Button>
              </form>
              <Button size='sm' variant='secondary' onclick={() => onReject(inv.id)} aria-label='Decline invitation'>
                <XIcon class='size-4' />
                <span class='
                  ml-1 hidden
                  sm:inline
                '>Decline</span>
              </Button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </Dialog.Content>
</Dialog.Root>
