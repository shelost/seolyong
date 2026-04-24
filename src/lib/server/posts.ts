import fs from 'node:fs/promises';
import path from 'node:path';

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

const POSTS_DIR = path.resolve('src/lib/content/posts');

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

function readPostFile(filename: string, raw: string): Post {
	const { frontmatter, body } = parseFrontmatter(raw);
	return {
		slug: slugFromFilename(filename),
		frontmatter: {
			title: frontmatter.title ?? slugFromFilename(filename),
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

async function listSlugs(): Promise<Set<string>> {
	const entries = await fs.readdir(POSTS_DIR);
	return new Set(entries.filter((f) => f.endsWith('.md')).map(slugFromFilename));
}

export async function uniqueSlugForDate(date: string, existingSlug?: string): Promise<string> {
	const slugs = await listSlugs();
	if (existingSlug && slugs.has(existingSlug)) return existingSlug;
	const base = date;
	if (!slugs.has(base)) return base;
	let i = 2;
	while (slugs.has(`${base}-${i}`)) i++;
	return `${base}-${i}`;
}

export async function listPosts(): Promise<Post[]> {
	const entries = await fs.readdir(POSTS_DIR);
	const md = entries.filter((f) => f.endsWith('.md'));

	const posts = await Promise.all(
		md.map(async (filename) => {
			const raw = await fs.readFile(path.join(POSTS_DIR, filename), 'utf8');
			return readPostFile(filename, raw);
		})
	);

	posts.sort(sortNewestFirst);
	return posts;
}

export async function getPost(slug: string): Promise<Post> {
	const filename = slug.endsWith('.md') ? slug : `${slug}.md`;
	const full = path.join(POSTS_DIR, filename);
	const raw = await fs.readFile(full, 'utf8');
	return readPostFile(filename, raw);
}

export async function deletePost(slug: string): Promise<void> {
	const filename = slug.endsWith('.md') ? slug : `${slug}.md`;
	const full = path.join(POSTS_DIR, filename);
	await fs.unlink(full);
}

export async function upsertPost(opts: {
	slug: string;
	title?: string;
	date: string;
	excerpt?: string;
	content: string;
}): Promise<void> {
	const safeSlug = opts.slug.replace(/[^a-zA-Z0-9-_]/g, '-');
	const full = path.join(POSTS_DIR, `${safeSlug}.md`);
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

	await fs.writeFile(full, fm + opts.content.trimStart(), 'utf8');
}
