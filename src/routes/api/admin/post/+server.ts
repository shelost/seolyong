import { json } from '@sveltejs/kit';
import { isAuthed } from '$lib/server/adminAuth';
import { deletePost, getPost, uniqueSlugForDate, upsertPost } from '$lib/server/posts';

export const GET = async ({ url, cookies }) => {
	if (!isAuthed(cookies)) return json({ error: 'Unauthorized' }, { status: 401 });
	const slug = url.searchParams.get('slug');
	if (!slug) return json({ error: 'Missing slug' }, { status: 400 });
	try {
		const post = await getPost(slug);
		return json({ slug: post.slug, content: post.content, frontmatter: post.frontmatter });
	} catch {
		return json({ error: 'Not found' }, { status: 404 });
	}
};

export const POST = async ({ request, cookies }) => {
	if (!isAuthed(cookies)) return json({ error: 'Unauthorized' }, { status: 401 });
	const body = await request.json().catch(() => ({}));
	const { slug, date, content, title, excerpt } = body ?? {};

	if (typeof date !== 'string' || !date) {
		return json({ error: 'Missing date' }, { status: 400 });
	}
	if (typeof content !== 'string') {
		return json({ error: 'Missing content' }, { status: 400 });
	}

	const finalSlug = await uniqueSlugForDate(date, typeof slug === 'string' ? slug : undefined);

	await upsertPost({
		slug: finalSlug,
		title: typeof title === 'string' ? title : undefined,
		date,
		excerpt: typeof excerpt === 'string' && excerpt ? excerpt : undefined,
		content
	});

	return json({ ok: true, slug: finalSlug });
};

export const DELETE = async ({ url, cookies }) => {
	if (!isAuthed(cookies)) return json({ error: 'Unauthorized' }, { status: 401 });
	const slug = url.searchParams.get('slug');
	if (!slug) return json({ error: 'Missing slug' }, { status: 400 });
	try {
		await deletePost(slug);
		return json({ ok: true });
	} catch {
		return json({ error: 'Not found' }, { status: 404 });
	}
};
