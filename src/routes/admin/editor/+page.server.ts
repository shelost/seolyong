import { redirect } from '@sveltejs/kit';
import { isAuthed } from '$lib/server/adminAuth';
import { listPosts } from '$lib/server/posts';

export const load = async ({ cookies }) => {
	if (!isAuthed(cookies)) throw redirect(302, '/admin');
	const posts = await listPosts();
	return { posts };
};
