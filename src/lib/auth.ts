import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './server/db';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';

export const auth = betterAuth({
	plugins: [sveltekitCookies(getRequestEvent)],

	database: drizzleAdapter(db, { provider: 'sqlite' }),

	emailAndPassword: { enabled: true },

	socialProviders: {
		google: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string
		}
	},

	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60
		}
	}
});
