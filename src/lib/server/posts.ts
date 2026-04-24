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
	// Very small frontmatter parser: expects ---\nkey: value\n---\n
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

export async function listPosts(): Promise<Array<Omit<Post, 'content'>>> {
	const entries = await fs.readdir(POSTS_DIR);
	const md = entries.filter((f) => f.endsWith('.md'));

	const posts = await Promise.all(
		md.map(async (filename) => {
			const raw = await fs.readFile(path.join(POSTS_DIR, filename), 'utf8');
			const { frontmatter } = parseFrontmatter(raw);
			return {
				slug: slugFromFilename(filename),
				frontmatter: {
					title: frontmatter.title ?? slugFromFilename(filename),
					date: frontmatter.date ?? '',
					excerpt: frontmatter.excerpt
				}
			};
		})
	);

	posts.sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));
	return posts;
}

export async function getPost(slug: string): Promise<Post> {
	const filename = slug.endsWith('.md') ? slug : `${slug}.md`;
	const full = path.join(POSTS_DIR, filename);
	const raw = await fs.readFile(full, 'utf8');
	const { frontmatter, body } = parseFrontmatter(raw);

	return {
		slug: slugFromFilename(filename),
		frontmatter: {
			title: frontmatter.title ?? slug,
			date: frontmatter.date ?? '',
			excerpt: frontmatter.excerpt
		},
		content: body
	};
}

export async function upsertPost(opts: {
	slug: string;
	title: string;
	date: string;
	excerpt?: string;
	content: string;
}): Promise<void> {
	const safeSlug = opts.slug.replace(/[^a-zA-Z0-9-_]/g, '-');
	const full = path.join(POSTS_DIR, `${safeSlug}.md`);
	const fm = [
		'---',
		`title: "${opts.title.replace(/\"/g, '')}"`,
		`date: "${opts.date}"`,
		opts.excerpt ? `excerpt: "${opts.excerpt.replace(/\"/g, '')}"` : null,
		'---',
		''
	]
		.filter(Boolean)
		.join('\n');

	await fs.writeFile(full, fm + opts.content.trimStart(), 'utf8');
}
