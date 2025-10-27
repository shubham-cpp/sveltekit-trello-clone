import { command, form, getRequestEvent, query } from '$app/server'
import { auth } from '$lib/server/auth'
import { db } from '$lib/server/db'
import { organizationQueries } from '$lib/server/db/queries'
import { user as userTable } from '$lib/server/db/schema'
import { updatePasswordSchema, updateProfileSchema } from '$lib/zod-schemas'
import { fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { z } from 'zod/v4'

// Schema for updating organization details
const updateOrganizationSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  slug: z.string().trim().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
})

const setActiveOrganizationSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
})
export interface UserOrganizations {
  organizations: {
    id: string
    name: string
    slug: string
    logo: string | null
    role: string
    isOwner: boolean
  }[]
  activeOrganizationId: string | undefined
}
export const getUserOrganizations = query(async () => {
  const { locals } = getRequestEvent()
  const userId = locals.user?.id

  if (!userId) {
    return fail(401, { error: 'Unauthorized' })
  }

  try {
    // Get all organizations the user is a member of
    const organizations = await organizationQueries.getUserOrganizations(userId)

    if (!organizations) {
      return []
    }

    // Get the active organization
    const activeOrg = await organizationQueries.getActiveOrganization(userId)

    // Return organizations with active status
    return {
      organizations,
      activeOrganizationId: activeOrg?.id,
    }
  }
  catch (error) {
    console.error('Error fetching user organizations:', error)
    return fail(500, { error: 'Failed to fetch organizations' })
  }
})

// Form to update organization details
export const updateOrganization = form(
  updateOrganizationSchema,
  async ({ organizationId, name, slug }) => {
    const { locals } = getRequestEvent()
    const userId = locals.user?.id

    if (!userId) {
      return redirect(307, '/login')
    }

    try {
      const updatedOrg = await organizationQueries.updateOrganization(userId, organizationId, {
        name,
        slug,
      })

      if (!updatedOrg) {
        return fail(403, { error: 'You do not have permission to update this organization or it does not exist' })
      }

      return {
        status: 200,
        message: 'Organization updated successfully',
        organization: updatedOrg,
      }
    }
    catch (error) {
      console.error('Error updating organization:', error)
      return fail(500, { error: 'Failed to update organization' })
    }
  },
)

export const updateProfile = form(updateProfileSchema, async ({ name }) => {
  const { locals } = getRequestEvent()
  const userId = locals.user?.id

  if (!userId) {
    return redirect(307, '/login')
  }

  try {
    const [updated] = await db
      .update(userTable)
      .set({ name })
      .where(eq(userTable.id, userId))
      .returning({ id: userTable.id, name: userTable.name, email: userTable.email })

    if (!updated) {
      return fail(400, { error: 'Failed to update profile' })
    }

    return {
      status: 200,
      message: 'Profile updated successfully',
      user: updated,
    }
  }
  catch (error) {
    console.error('Error updating profile:', error)
    return fail(500, { error: 'Failed to update profile' })
  }
})

export const updatePassword = form(
  updatePasswordSchema,
  async ({ _currentPassword: currentPassword, _newPassword: newPassword }) => {
    const { locals, request } = getRequestEvent()
    const userId = locals.user?.id

    if (!userId) {
      return redirect(307, '/login')
    }

    try {
      await auth.api.changePassword({
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        },
        headers: request.headers,
      })

      return {
        status: 200,
        message: 'Password updated successfully',
      }
    }
    catch (error) {
      console.error('Error updating password:', error)
      return fail(400, { error: 'Failed to update password. Check your current password.' })
    }
  },
)

export const setActiveOrganization = command(
  setActiveOrganizationSchema,
  async ({ organizationId }) => {
    const { locals } = getRequestEvent()
    const userId = locals.user?.id

    if (!userId) {
      return fail(401, { error: 'Unauthorized' })
    }

    try {
      const success = await organizationQueries.setActiveOrganization(userId, organizationId)

      if (!success) {
        return fail(403, { error: 'Failed to set active organization' })
      }

      // Refresh the getUserOrganizations query to update the UI
      getUserOrganizations().refresh()

      return {
        status: 200,
        message: 'Active organization updated successfully',
      }
    }
    catch (error) {
      console.error('Error setting active organization:', error)
      return fail(500, { error: 'Failed to set active organization' })
    }
  },
)
