<script lang='ts'>
  import type { UserOrganizations } from './data.remote'
  import { invalidateAll } from '$app/navigation'
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar'
  import { buttonVariants } from '$lib/components/ui/button/button.svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
  import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte'
  import { cn, getPrefix } from '$lib/utils'
  import BuildingIcon from '@lucide/svelte/icons/building'
  import CheckIcon from '@lucide/svelte/icons/check'
  import EditIcon from '@lucide/svelte/icons/edit-3'
  import { onMount } from 'svelte'
  import { getUserOrganizations, setActiveOrganization } from './data.remote'

  let loading = $state(true)
  let data = $state<UserOrganizations>({ organizations: [], activeOrganizationId: undefined })
  const activeOrganization = $derived(data.organizations.find(
    org => org.id === data.activeOrganizationId,
  ))

  onMount(async () => {
    try {
      const result = await getUserOrganizations()
      if ('organizations' in result) {
        data = result
      }
    }
    catch (error) {
      console.error('Error fetching organizations:', error)
    }
    finally {
      loading = false
    }
  })

  // Function to handle setting active organization
  async function handleSetActive(organizationId: string) {
    await setActiveOrganization({ organizationId })
    const result = await getUserOrganizations()
    if ('organizations' in result) {
      data = result
    }
    invalidateAll()
  }

</script>

{#if loading}
  <div class='flex flex-col items-center space-y-1'>
    <Skeleton class='h-3 w-4 rounded-full' />
    <Skeleton class='h-4 w-8' />
  </div>
{:else if data.organizations && data.organizations.length > 0}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class={cn(buttonVariants({ variant: 'ghost', size: 'icon-lg' }), `
      cursor-pointer
    `)}>
      <Avatar class='bg-transparent'>
        <AvatarImage
          src={activeOrganization?.logo}
          alt={activeOrganization?.name}
          class='object-cover'
        />
        <AvatarFallback class='bg-transparent'>
          {getPrefix(activeOrganization?.name ?? 'Organization')}
        </AvatarFallback>
      </Avatar>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class='sm:mr-8'>
      <DropdownMenu.Label>
        <p class='font-semibold'>Workspaces</p>
      </DropdownMenu.Label>
      <DropdownMenu.Separator />

      <!-- Organizations owned by the user -->
      {#if data.organizations.some(org => org.isOwner)}
        <DropdownMenu.Group>
          <DropdownMenu.Label>
            <p class='text-xs text-muted-foreground'>Your workspaces</p>
          </DropdownMenu.Label>
          {#each data.organizations.filter(org => org.isOwner) as org (org.id)}
            <DropdownMenu.Item
              class='flex items-center justify-between'
              onclick={() => handleSetActive(org.id)}
            >
              <div class='flex items-center gap-2'>
                <BuildingIcon class='h-4 w-4' />
                <span>{org.name}</span>
              </div>
              <div class='flex items-center gap-2'>
                {#if org.id === data.activeOrganizationId}
                  <CheckIcon class='h-4 w-4 text-green-500' />
                {/if}
                <EditIcon
                  class='
                    h-4 w-4 cursor-pointer text-muted-foreground
                    hover:text-foreground
                  '
                  onclick={(e) => {
                    e.stopPropagation()
                  // TODO: implement this
                    // openEditDialog(org)
                  }}
                />
              </div>
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
      {/if}

      <!-- Organizations the user is a member of but doesn't own -->
      {#if data.organizations.some(org => !org.isOwner)}
        <DropdownMenu.Group>
          <DropdownMenu.Label>
            <p class='text-xs text-muted-foreground'>Member workspaces</p>
          </DropdownMenu.Label>
          {#each data.organizations.filter(org => !org.isOwner) as org (org.id)}
            <DropdownMenu.Item
              class='flex items-center justify-between'
              onclick={() => handleSetActive(org.id)}
            >
              <div class='flex items-center gap-2'>
                <BuildingIcon class='h-4 w-4' />
                <span>{org.name}</span>
              </div>
              {#if org.id === data.activeOrganizationId}
                <CheckIcon class='h-4 w-4 text-green-500' />
              {/if}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}

<!-- Edit workspace dialog -->
<!-- {#if showEditDialog && selectedOrganization}
  <EditWorkspaceDialog
    open={showEditDialog}
    organization={selectedOrganization}
    on:updated={async () => {
      // Refresh data after updating organization
      const result = await getUserOrganizations()
      if ('organizations' in result) {
        organizationsData = result
      }
    }}
  />
{/if} -->
