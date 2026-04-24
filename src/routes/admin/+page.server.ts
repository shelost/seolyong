import { redirect } from '@sveltejs/kit';
import { isAuthed } from '$lib/server/adminAuth';

export const load = async ({ cookies }) => {
	if (isAuthed(cookies)) throw redirect(302, '/admin/editor');
};
