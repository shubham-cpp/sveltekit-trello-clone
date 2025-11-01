<script lang='ts'>
  import type { UserOrganizations } from './data.remote'
  import { getPrefix } from '$lib/utils'
  import { Avatar, AvatarFallback, AvatarImage } from '$ui/avatar'
  import Button from '$ui/button/button.svelte'
  import BuildingIcon from '@lucide/svelte/icons/building'
  import CheckIcon from '@lucide/svelte/icons/check'
  import EditIcon from '@lucide/svelte/icons/edit-3'
  import { onClickOutside, useEventListener } from 'runed'
  import { setActiveOrganization } from './data.remote'

  interface Props {
    organizationInfo: UserOrganizations
  }

  const { organizationInfo: data }: Props = $props()

  let dialogOpen = $state(false)

  const activeOrganization = $derived(data.organizations.find(
    org => org.id === data.activeOrganizationId,
  ))

  const ownerOrgs = $derived(data.organizations.filter(org => org.isOwner))
  const notOwnerOrgs = $derived(data.organizations.filter(org => !org.isOwner))

  let container = $state<HTMLElement>()!

  // To close the dialog box
  onClickOutside(
    () => container,
    () => (dialogOpen = false),
  )

  useEventListener(
    () => container,
    'keydown',
    ({ key }) => {
      if (!dialogOpen)
        return
      if (key === 'Escape') {
        dialogOpen = false
      }
    },
  )
</script>
<div class='relative inline-block' bind:this={container} id='dropdown-container'>

  <Button
    id='dropdown-trigger'
    onclick={() => (dialogOpen = !dialogOpen)}
    variant='ghost'
    size='icon-lg'
    type='button'
    aria-haspopup='menu'
    aria-expanded={dialogOpen}
    aria-controls='dropdown-menu'
  >
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
  </Button>

  <!-- Dropdown menu -->
  <div
    id='dropdown-menu'
    role='menubar'
    aria-labelledby='dropdown-trigger'
    class='
      absolute top-12 right-0 z-50 w-64 min-w-[8rem] origin-top-right
      overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1
      text-popover-foreground shadow-md outline-none
      data-[state=closed]:animate-out data-[state=closed]:fade-out-0
      data-[state=closed]:zoom-out-95
      data-[state=open]:animate-in data-[state=open]:fade-in-0
      data-[state=open]:zoom-in-95
    '
    class:hidden={!dialogOpen}
    class:animate-in={dialogOpen}
    class:fade-in-0={dialogOpen}
    class:zoom-in-95={dialogOpen}
    class:animate-out={!dialogOpen}
    class:fade-out-0={!dialogOpen}
    class:zoom-out-95={!dialogOpen}
  >
    <!-- Workspaces owned by the user, user can edit -->
    {@render workspaceItems(ownerOrgs, 'Your workspaces', true)}
    <!-- Workspaces user is part of, use cannot edit -->
    {@render workspaceItems(notOwnerOrgs, 'Members workspaces')}
  </div>
</div>

{#snippet workspaceItems(orgs: UserOrganizations['organizations'], title: string, isEditable = false)}
  {#if orgs.length > 0}
    <div class='px-2 py-1.5 text-sm font-semibold' role='presentation'>
      <div role='heading' aria-level='2'>{title}</div>
    </div>
    <div class='-mx-1 my-1 h-px bg-border' role='separator' aria-orientation='horizontal'></div>
    <ul class='py-1 text-sm' role='menu'>
      {#each orgs as org (org.id)}
        <li
          role='menuitem'
          class='
            relative flex cursor-default items-center gap-2 rounded-sm px-2
            py-1.5 text-sm outline-hidden select-none
            hover:bg-accent hover:text-accent-foreground
          '
        >
          <form class='flex w-full' id={`change-org-${org.id}`} {...setActiveOrganization.for(org.id).enhance(async ({ submit }) => { await submit() })}>
            <input type='hidden' name='organizationId' value={org.id}>
            <button
              class='flex w-full cursor-pointer items-center gap-2'
              {...setActiveOrganization.for(org.id).buttonProps}
            >
              <BuildingIcon class='size-4' />
              <span>{org.name}</span>
            </button>
            <div class='flex items-center gap-2'>
              {#if org.id === data.activeOrganizationId}
                <CheckIcon class='size-4 text-green-500' />
              {/if}
              {#if isEditable}
                <EditIcon
                  class='
                    size-4 cursor-pointer text-muted-foreground
                    hover:text-foreground
                  '
                  onclick={(e) => {
                    e.stopPropagation()
                  // TODO: implement this
                  }}
                />
              {/if}
            </div>
          </form>
        </li>
      {/each}
    </ul>
  {/if}
{/snippet}

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
