import { getRequestEvent } from '$app/server'
import { env } from '$env/dynamic/private'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins'
import { sveltekitCookies } from 'better-auth/svelte-kit'
import { nanoid } from 'nanoid'
import { db } from './db'
import { member as memberTable, organization as orgTable } from './db/schema'

export const auth = betterAuth({
  plugins: [organization(), sveltekitCookies(getRequestEvent)],

  database: drizzleAdapter(db, { provider: 'sqlite' }),

  emailAndPassword: { enabled: true },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  // Create a default organization for every new user
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const name = `${user.name ?? 'Default'}'s Org`
            const base = name
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
            const slug = `${base}-${nanoid(8)}`
            const orgId = nanoid()

            // Create organization
            await db.insert(orgTable).values({
              id: orgId,
              name,
              slug,
              createdAt: new Date(),
              logo: null,
              metadata: null,
            })

            // Add creator as owner
            await db.insert(memberTable).values({
              id: nanoid(),
              organizationId: orgId,
              userId: user.id,
              role: 'owner',
              createdAt: new Date(),
            })
          }
          catch (e) {
            // Do not block sign-up on org creation failure
            console.error('Failed to create default organization', e)
          }
        },
      },
    },
    // Optional: set active organization during session creation in future
    // session: {
    //   create: {
    //     before: async (session) => {
    //       // Implement if you want to set activeOrganizationId here
    //       return { data: session }
    //     },
    //   },
    // },
  },
})
