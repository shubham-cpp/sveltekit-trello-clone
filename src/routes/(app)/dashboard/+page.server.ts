import { boardQueries } from '$lib/server/db/queries';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (events) => {
	console.log(events.locals.user);
	const { email, id, name } = events?.locals?.user ?? {};

	if (!id) redirect(307, '/login');

	return {
		user: { id, email, name },
		boards: (await boardQueries.getAll(id)) ?? []
	};
};

export const actions = {
	default: async (event) => {
		const userId = event?.locals?.user?.id;
		if (!userId) return fail(403, "You don't have access");
		try {
			const res = await boardQueries.createWithDefaultColumns(userId, {
				title: 'New Board',
				description: 'This is a demo board',
				color: null
			});
		} catch (error) {}
	}
} satisfies Actions;
