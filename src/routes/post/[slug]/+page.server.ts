import { error } from '@sveltejs/kit';
import { getPost } from '$lib/server/posts';

export const load = async ({ params }) => {
	try {
		const post = await getPost(params.slug);
		return { post };
	} catch (e) {
		throw error(404, 'Not found');
	}
};
