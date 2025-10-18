import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (events) => {
	console.log(events.locals.user);
	const { email, id, name } = events.locals.user;
	return {
		user: { id, email, name }
	};
};
