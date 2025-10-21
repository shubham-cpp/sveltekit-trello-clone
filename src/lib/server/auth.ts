import { getRequestEvent } from '$app/server'
import { env } from '$env/dynamic/private'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { sveltekitCookies } from 'better-auth/svelte-kit'
import { db } from './db'

export const auth = betterAuth({
  plugins: [sveltekitCookies(getRequestEvent)],

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
})
