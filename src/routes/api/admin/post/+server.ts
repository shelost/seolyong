import { json } from '@sveltejs/kit';
import { isAuthed } from '$lib/server/adminAuth';
import { getPost, upsertPost } from '$lib/server/posts';

export const GET = async ({ url, cookies }) => {
	if (!isAuthed(cookies)) return json({ error: 'Unauthorized' }, { status: 401 });
	const slug = url.searchParams.get('slug');
	if (!slug) return json({ error: 'Missing slug' }, { status: 400 });
	try {
		const post = await getPost(slug);
		return json({ content: post.content, frontmatter: post.frontmatter });
	} catch {
		return json({ error: 'Not found' }, { status: 404 });
	}
};

export const POST = async ({ request, cookies }) => {
	if (!isAuthed(cookies)) return json({ error: 'Unauthorized' }, { status: 401 });
	const body = await request.json().catch(() => ({}));
	const { slug, title, date, excerpt, content } = body ?? {};

	if (typeof slug !== 'string' || typeof title !== 'string' || typeof date !== 'string' || typeof content !== 'string') {
		return json({ error: 'Invalid payload' }, { status: 400 });
	}

	await upsertPost({ slug, title, date, excerpt, content });
	return json({ ok: true });
};
