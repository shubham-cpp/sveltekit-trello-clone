import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (events) => {
	if (events.locals.user?.id) {
		redirect(307, '/dashboard');
	}
	return {};
};
