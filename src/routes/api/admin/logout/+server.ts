import { json } from '@sveltejs/kit';
import { clearAuthed } from '$lib/server/adminAuth';

export const POST = async ({ cookies }) => {
	clearAuthed(cookies);
	return json({ ok: true });
};
