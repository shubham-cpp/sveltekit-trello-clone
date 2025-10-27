<script lang='ts'>
  import type { ViewMode } from '$lib/utils'
  import * as ButtonGroup from '$lib/components/ui/button-group'
  import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte'
  import * as Command from '$lib/components/ui/command/index.js'
  import * as Dialog from '$lib/components/ui/dialog'
  import Input from '$lib/components/ui/input/input.svelte'
  import * as Label from '$lib/components/ui/label'
  import * as Popover from '$lib/components/ui/popover'
  import * as Select from '$lib/components/ui/select'
  import { cn } from '$lib/utils'
  import CheckIcon from '@lucide/svelte/icons/check'
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down'
  import FunnelIcon from '@lucide/svelte/icons/funnel'
  import LayoutGridIcon from '@lucide/svelte/icons/layout-grid'
  import ListIcon from '@lucide/svelte/icons/list'
  import PlusIcon from '@lucide/svelte/icons/plus'
  import SearchIcon from '@lucide/svelte/icons/search'
  import { useDebounce } from 'runed'
  import { tick } from 'svelte'
  import { searchOrganizationMembers } from '../data.remote'

  interface BoardFilterProps {
    formId: string
    viewMode: ViewMode
    onViewModeChange: (newMode: ViewMode) => void
    params: any
  }

  const { formId, viewMode, onViewModeChange, params }: BoardFilterProps = $props()

  let activeTab = $state<'filter' | 'sort'>('filter')

  // Created By search state
  let createdByPopoverOpen = $state(false)
  let createdBySearch = $state('')
  let createdByResults = $state<Array<{ id: string, name: string, email: string, image: string | null, role: string }>>([])
  let createdBySearching = $state(false)
  let selectedCreator = $state<{ id: string, name: string, email: string, image: string | null, role: string } | null>(null)
  let createdByTriggerRef = $state<HTMLButtonElement | null>(null)

  const debouncedMemberSearch = useDebounce(
    async () => {
      if (!createdBySearch.trim()) {
        createdByResults = []
        return
      }
      createdBySearching = true
      try {
        const res = await searchOrganizationMembers({ query: createdBySearch })
        createdByResults = Array.isArray(res) ? res : []
      }
      catch (e) {
        console.error('Error searching org members:', e)
        createdByResults = []
      }
      finally {
        createdBySearching = false
      }
    },
    () => 300,
  )

  function handleCreatorSearch() {
    debouncedMemberSearch()
  }

  function selectCreator(member: { id: string, name: string, email: string, image: string | null, role: string }) {
    selectedCreator = member
    params.created_by = member.id
    createdByPopoverOpen = false
    createdBySearch = ''
    createdByResults = []
  }

  function clearCreator() {
    params.created_by = ''
    selectedCreator = null
  }
</script>

<section class='
  mb-6
  sm:mb-8
'>
  <div
    class='
      mb-4 flex flex-col space-y-4
      sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-1
    '
  >
    <div>
      <h2 class='
        text-xl font-bold
        sm:text-2xl
      '>Your Boards</h2>
      <p class='text-primary-foreground/70'>Manage your projects and tasks</p>
    </div>
    <!-- Filter Options -->
    <div
      class='
        flex grow flex-col items-stretch justify-end space-y-2
        sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4
      '
    >
      <div
        class='
          mr-2 flex items-center gap-x-2 rounded-lg border border-border
          bg-neutral-100 p-1
          sm:mr-4
          dark:bg-zinc-900
        '
      >
        <Button
          onclick={() => {
            onViewModeChange('grid')
          }}
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size='icon'
        >
          <LayoutGridIcon class='
            size-4
            sm:size-5
          ' />
        </Button>
        <Button
          onclick={() => {
            onViewModeChange('list')
          }}
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size='icon'
        >
          <ListIcon class='
            size-4
            sm:size-5
          ' />
        </Button>
      </div>
      <Dialog.Root>
        <Dialog.Trigger class={[buttonVariants({ variant: 'outline' })]}>
          <FunnelIcon class='
            size-4
            sm:size-5
          ' /> <span>Filter</span>
        </Dialog.Trigger>
        <Dialog.Content class='w-[min(92vw,1100px)] max-w-[92vw]' style='max-width: min(92vw, 1100px);'>
          <Dialog.Header>
            <Dialog.Title>Filter & Sort Boards</Dialog.Title>
            <Dialog.Description>Refine your boards list using filters and sorting</Dialog.Description>
          </Dialog.Header>

          <!-- Filters & Sort content inside dialog -->
          <section class='
            mt-4 flex flex-col gap-6
            sm:flex-row
          '>
            <div class='
              flex w-36 shrink-0 space-y-2
              sm:flex-col
            '>
              <Button
                variant={activeTab === 'filter' ? 'default' : 'ghost'}
                class='w-full justify-start'
                onclick={() => (activeTab = 'filter')}
              >
                Filter
              </Button>
              <Button
                variant={activeTab === 'sort' ? 'default' : 'ghost'}
                class='w-full justify-start'
                onclick={() => (activeTab = 'sort')}
              >
                Sort
              </Button>
            </div>

            <div class='flex-1 space-y-6'>
              {#if activeTab === 'filter'}

                <div class='space-y-2'>
                  <h3 class='font-medium'>Created At</h3>
                  <div class='
                    grid gap-2
                    sm:grid-cols-3
                  '>
                    <div>
                      <Label.Root for='created_at_min'>Min</Label.Root>
                      <Input id='created_at_min' type='date' bind:value={params.created_at_min} />
                    </div>
                    <div>
                      <Label.Root for='created_at_max'>Max</Label.Root>
                      <Input id='created_at_max' type='date' bind:value={params.created_at_max} />
                    </div>
                    <div>
                      <Label.Root for='created_at_exact'>Exact</Label.Root>
                      <Input id='created_at_exact' type='date' bind:value={params.created_at_exact} />
                    </div>
                  </div>
                </div>

                <div class='space-y-2'>
                  <h3 class='font-medium'>Updated At</h3>
                  <div class='
                    grid gap-2
                    sm:grid-cols-3
                  '>
                    <div>
                      <Label.Root for='updated_at_min'>Min</Label.Root>
                      <Input id='updated_at_min' type='date' bind:value={params.updated_at_min} />
                    </div>
                    <div>
                      <Label.Root for='updated_at_max'>Max</Label.Root>
                      <Input id='updated_at_max' type='date' bind:value={params.updated_at_max} />
                    </div>
                    <div>
                      <Label.Root for='updated_at_exact'>Exact</Label.Root>
                      <Input id='updated_at_exact' type='date' bind:value={params.updated_at_exact} />
                    </div>
                  </div>
                </div>

                <div class='space-y-2'>
                  <h3 class='font-medium'>Created By</h3>
                  {#key params.created_by}
                    <Popover.Root bind:open={createdByPopoverOpen}>
                      <Popover.Trigger bind:ref={createdByTriggerRef}>
                        {#snippet child({ props })}
                          <Button
                            variant='outline'
                            class='w-[280px] justify-between'
                            {...props}
                            role='combobox'
                            aria-expanded={createdByPopoverOpen}
                          >
                            {#if selectedCreator}
                              {selectedCreator.name}
                              <span class='ml-2 text-xs text-foreground/60'>({selectedCreator.email})</span>
                            {:else if params.created_by}
                              Selected: {params.created_by}
                            {:else}
                              Search by name or email
                            {/if}
                            <ChevronsUpDownIcon class='
                              ml-2 size-4 shrink-0 opacity-50
                            ' />
                          </Button>
                        {/snippet}
                      </Popover.Trigger>
                      <Popover.Content class='w-[320px] p-0'>
                        <Command.Root>
                          <Command.Input
                            placeholder='Search members...'
                            oninput={(e) => {
                              const target = e.currentTarget as HTMLInputElement
                              createdBySearch = target.value
                              handleCreatorSearch()
                            }}
                          />
                          <Command.List>
                            <Command.Empty>
                              {createdBySearching ? 'Searching...' : 'No members found.'}
                            </Command.Empty>
                            <Command.Group>
                              {#each createdByResults as member}
                                <Command.Item
                                  value={member.id}
                                  onSelect={() => {
                                    selectCreator(member)
                                    createdByPopoverOpen = false
                                    tick().then(() => {
                                      createdByTriggerRef?.focus?.()
                                    })
                                  }}
                                >
                                  <CheckIcon
                                    class={cn(
                                      'mr-2 size-4',
                                      params.created_by !== member.id && `
                                        text-transparent
                                      `,
                                    )}
                                  />
                                  <span>{member.name}</span>
                                  <span class='ml-2 text-xs text-foreground/60'>{member.email}</span>
                                </Command.Item>
                              {/each}
                            </Command.Group>
                          </Command.List>
                        </Command.Root>
                      </Popover.Content>
                    </Popover.Root>
                  {/key}

                  {#if params.created_by}
                    <div class='text-xs text-foreground/60'>
                      Selected user id: <code>{params.created_by}</code>
                      <button class='ml-2 underline' type='button' onclick={clearCreator}>
                        Clear
                      </button>
                    </div>
                  {/if}
                </div>
              {:else}
                <div class='
                  grid gap-4
                  sm:grid-cols-2
                '>
                  <div class='space-y-1'>
                    <Label.Root for='sortBy'>Sort by</Label.Root>
                    <Select.Root type='single' onValueChange={v => (params.sort_by = v as any)}>
                      <Select.Trigger id='sortBy' class='capitalize'>
                        {params.sort_by}
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item id='updatedAt' value='updatedAt' label='updatedAt' class='
                          capitalize
                        ' />
                        <Select.Item id='createdAt' value='createdAt' label='createdAt' class='
                          capitalize
                        ' />
                        <Select.Item id='title' value='title' label='title' class='
                          capitalize
                        ' />
                      </Select.Content>
                    </Select.Root>
                  </div>

                  <div class='space-y-1'>
                    <Label.Root for='sortDir'>Direction</Label.Root>
                    <Select.Root type='single' onValueChange={v => (params.sort_dir = v as any)}>
                      <Select.Trigger id='sortDir' class='uppercase'>
                        {params.sort_dir}
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item id='asc' value='asc' label='asc' class='
                          uppercase
                        ' />
                        <Select.Item id='desc' value='desc' label='desc' class='
                          uppercase
                        ' />
                      </Select.Content>
                    </Select.Root>
                  </div>
                </div>
              {/if}
            </div>
          </section>
        </Dialog.Content>
      </Dialog.Root>
      <Button type='submit' form={formId} class='
        flex items-center gap-x-2 px-4
      '>
        <PlusIcon class='
          size-4
          sm:size-5
        ' /> <span>Create</span>
      </Button>
    </div>
    <!-- Search Bar -->
    <form method='get'>
      <ButtonGroup.Root class='pl-6'>
        <Input placeholder='Search boards...' bind:value={params.q} />
        <Button type='submit' variant='outline' size='icon' aria-label='Search'>
          <SearchIcon />
        </Button>
      </ButtonGroup.Root>
    </form>
  </div>
</section>

<!-- Filters & Sort moved into Dialog.Content above -->
