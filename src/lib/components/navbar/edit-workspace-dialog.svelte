<script lang='ts'>
  import { Button } from '$lib/components/ui/button'
  import * as Dialog from '$lib/components/ui/dialog'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'

  type Organization = {
    id: string
    name: string
    slug: string
    logo: string | null
  }

  interface EditWorkspaceDialogProps {
    open: boolean
    organization: Organization
    onUpdated: (org: Pick<Organization, 'id' | 'name' | 'slug'>) => void
    onClose: () => void
  }

  const { open, organization, onClose, onUpdated }: EditWorkspaceDialogProps = $props()
  // Local state
  let name = $state('')
  let slug = $state('')
  let loading = $state(false)
  let error = $state('')
  let success = $state('')
  let isOpen = $state(open)

  $effect(() => {
    if (organization) {
      name = organization.name
      slug = organization.slug
    }
  })

  // Handle form submission
  async function handleSubmit() {
    // Reset status
    error = ''
    success = ''
    loading = true

    try {
      // Validate form
      if (!name.trim()) {
        error = 'Name is required'
        loading = false
        return
      }

      if (!slug.trim()) {
        error = 'Slug is required'
        loading = false
        return
      }

      // Validate slug format (lowercase letters, numbers, and hyphens only)
      if (!/^[a-z0-9-]+$/.test(slug)) {
        error = 'Slug can only contain lowercase letters, numbers, and hyphens'
        loading = false
        return
      }

      // Create form data
      const formData = new FormData()
      formData.append('organizationId', organization.id)
      formData.append('name', name)
      formData.append('slug', slug)

      // Submit form using the form action
      const response = await fetch('?/updateOrganization', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.error) {
        error = result.error
      }
      else {
        success = 'Organization updated successfully'
        onUpdated(result.data.organization)
        setTimeout(() => {
          onClose()
          isOpen = false
        }, 500)
      }
    }
    catch (err) {
      console.error('Error updating organization:', err)
      error = 'An unexpected error occurred'
    }
    finally {
      loading = false
    }
  }

  // Handle cancel button
  function handleCancel() {
    onClose()
  }
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class='sm:max-w-[425px]'>
    <Dialog.Header>
      <Dialog.Title>Edit Workspace</Dialog.Title>
      <Dialog.Description>
        Update your workspace details. Click save when you're done.
      </Dialog.Description>
    </Dialog.Header>

    <form on:submit|preventDefault={handleSubmit} class='space-y-4 pt-4'>
      <div class='space-y-2'>
        <Label for='name'>Name</Label>
        <Input
          id='name'
          bind:value={name}
          placeholder='My Workspace'
          disabled={loading}
        />
      </div>

      <div class='space-y-2'>
        <Label for='slug'>Slug</Label>
        <Input
          id='slug'
          bind:value={slug}
          placeholder='my-workspace'
          disabled={loading}
        />
        <p class='text-xs text-muted-foreground'>
          The slug is used in URLs and must be unique. Use only lowercase letters, numbers, and hyphens.
        </p>
      </div>

      {#if error}
        <p class='text-sm font-medium text-destructive'>{error}</p>
      {/if}

      {#if success}
        <p class='
          text-sm font-medium text-green-600
          dark:text-green-500
        '>{success}</p>
      {/if}

      <Dialog.Footer>
        <Button
          variant='outline'
          disabled={loading}
          onclick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save changes'}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
