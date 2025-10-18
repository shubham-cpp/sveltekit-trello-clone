import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';

export const auth = betterAuth({
	plugins: [sveltekitCookies(getRequestEvent)],

	database: drizzleAdapter(db, { provider: 'sqlite' }),

	emailAndPassword: { enabled: true },

	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET
		}
	},

	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60
		}
	}
});
