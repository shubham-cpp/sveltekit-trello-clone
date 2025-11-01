import type { UserOrganizations } from '$lib/components/navbar/data.remote'
import type { LayoutServerLoad } from './$types'
import { organizationQueries } from '$db/queries'
import { redirect } from '@sveltejs/kit'

async function getUserOrganizations(userId: string): Promise<UserOrganizations> {
  const organizations = await organizationQueries.getUserOrganizations(userId)

  if (!organizations) {
    return {
      organizations: [],
      activeOrganizationId: undefined,
    }
  }

  const activeOrg = await organizationQueries.getActiveOrganization(userId)

  return {
    organizations,
    activeOrganizationId: activeOrg?.id,
  }
}

export const load: LayoutServerLoad = async (events) => {
  const userId = events.locals.user?.id
  if (!userId) {
    redirect(307, '/login')
  }
  return { organizationInfo: getUserOrganizations(userId) }
}
