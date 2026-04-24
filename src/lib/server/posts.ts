import { dev } from '$app/environment';

export type PostFrontmatter = {
	title: string;
	date: string;
	excerpt?: string;
};

export type Post = {
	slug: string;
	frontmatter: PostFrontmatter;
	content: string;
};

// Bundle every markdown file under src/lib/content/posts at build time.
// This makes posts available in serverless environments (Vercel, etc.)
// without touching the filesystem at runtime.
const rawPosts = import.meta.glob('/src/lib/content/posts/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

function slugFromPath(filepath: string) {
	const filename = filepath.split('/').pop() ?? filepath;
	return filename.replace(/\.md$/, '');
}

function slugFromFilename(filename: string) {
	return filename.replace(/\.md$/, '');
}

function parseFrontmatter(raw: string): { frontmatter: Record<string, string>; body: string } {
	if (!raw.startsWith('---')) {
		return { frontmatter: {}, body: raw };
	}
	const end = raw.indexOf('\n---', 3);
	if (end === -1) return { frontmatter: {}, body: raw };

	const fmBlock = raw.slice(3, end).trim();
	const body = raw.slice(end + '\n---'.length).trimStart();
	const fm: Record<string, string> = {};

	for (const line of fmBlock.split('\n')) {
		const idx = line.indexOf(':');
		if (idx === -1) continue;
		const k = line.slice(0, idx).trim();
		let v = line.slice(idx + 1).trim();
		v = v.replace(/^"|"$/g, '');
		fm[k] = v;
	}

	return { frontmatter: fm, body };
}

function buildPost(slug: string, raw: string): Post {
	const { frontmatter, body } = parseFrontmatter(raw);
	return {
		slug,
		frontmatter: {
			title: frontmatter.title ?? slug,
			date: frontmatter.date ?? '',
			excerpt: frontmatter.excerpt
		},
		content: body
	};
}

function sortNewestFirst(a: Post, b: Post) {
	if (a.frontmatter.date !== b.frontmatter.date) {
		return a.frontmatter.date < b.frontmatter.date ? 1 : -1;
	}
	return a.slug < b.slug ? 1 : -1;
}

export function formatDateLong(date: string): string {
	// Parse as local date (avoid UTC shift on ISO strings like "2026-04-25")
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
	const dt = m
		? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
		: new Date(date);
	if (Number.isNaN(dt.getTime())) return date;
	return dt.toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
}

function getBundledPosts(): Map<string, Post> {
	const map = new Map<string, Post>();
	for (const [filepath, raw] of Object.entries(rawPosts)) {
		const slug = slugFromPath(filepath);
		map.set(slug, buildPost(slug, raw));
	}
	return map;
}

export async function listPosts(): Promise<Post[]> {
	const posts = Array.from(getBundledPosts().values());
	posts.sort(sortNewestFirst);
	return posts;
}

export async function getPost(slug: string): Promise<Post> {
	const cleanSlug = slug.endsWith('.md') ? slug.replace(/\.md$/, '') : slug;
	const post = getBundledPosts().get(cleanSlug);
	if (!post) {
		throw new Error(`Post not found: ${cleanSlug}`);
	}
	return post;
}

export async function uniqueSlugForDate(date: string, existingSlug?: string): Promise<string> {
	const slugs = new Set(getBundledPosts().keys());
	if (existingSlug && slugs.has(existingSlug)) return existingSlug;
	const base = date;
	if (!slugs.has(base)) return base;
	let i = 2;
	while (slugs.has(`${base}-${i}`)) i++;
	return `${base}-${i}`;
}

// ---------------------------------------------------------------------------
// Write operations
//
// Vercel serverless functions have a read-only filesystem (outside /tmp), so
// these only work in local `dev`. In production they no-op with a clear error
// instead of crashing the process. If you want editing in prod, move posts to
// a database (Supabase, etc.) and swap these implementations.
// ---------------------------------------------------------------------------

async function writeFsPost(filename: string, contents: string): Promise<void> {
	const fs = await import('node:fs/promises');
	const path = await import('node:path');
	const dir = path.resolve('src/lib/content/posts');
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, filename), contents, 'utf8');
}

async function unlinkFsPost(filename: string): Promise<void> {
	const fs = await import('node:fs/promises');
	const path = await import('node:path');
	const dir = path.resolve('src/lib/content/posts');
	await fs.unlink(path.join(dir, filename));
}

export async function deletePost(slug: string): Promise<void> {
	if (!dev) {
		throw new Error('deletePost is only available in development.');
	}
	const filename = slug.endsWith('.md') ? slug : `${slug}.md`;
	await unlinkFsPost(filename);
}

export async function upsertPost(opts: {
	slug: string;
	title?: string;
	date: string;
	excerpt?: string;
	content: string;
}): Promise<void> {
	if (!dev) {
		throw new Error('upsertPost is only available in development.');
	}
	const safeSlug = opts.slug.replace(/[^a-zA-Z0-9-_]/g, '-');
	const title = (opts.title && opts.title.trim()) || formatDateLong(opts.date);
	const fm = [
		'---',
		`title: "${title.replace(/"/g, '')}"`,
		`date: "${opts.date}"`,
		opts.excerpt ? `excerpt: "${opts.excerpt.replace(/"/g, '')}"` : null,
		'---',
		''
	]
		.filter(Boolean)
		.join('\n');

	await writeFsPost(`${safeSlug}.md`, fm + opts.content.trimStart());
}

// Re-export for callers that still import this name.
export { slugFromFilename };
