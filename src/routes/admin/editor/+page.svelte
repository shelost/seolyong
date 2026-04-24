<script lang="ts">
	let { data } = $props();
	const posts = $derived(
		data.posts as Array<{ slug: string; frontmatter: { title: string; date: string; excerpt?: string } }>
	);

	let slug = $state('');
	let title = $state('');
	let date = $state(new Date().toISOString().slice(0, 10));
	let excerpt = $state('');
	let content = $state('');
	let status = $state<string | null>(null);
	let saving = $state(false);

	function loadPost(p: (typeof posts)[number]) {
		slug = p.slug;
		title = p.frontmatter.title;
		date = p.frontmatter.date;
		excerpt = p.frontmatter.excerpt ?? '';
		// fetch content
		fetch(`/api/admin/post?slug=${encodeURIComponent(p.slug)}`)
			.then((r) => r.json())
			.then((j) => {
				content = j.content ?? '';
			})
			.catch(() => {
				content = '';
			});
	}

	async function save() {
		saving = true;
		status = null;
		try {
			const res = await fetch('/api/admin/post', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ slug, title, date, excerpt, content })
			});
			const j = await res.json().catch(() => ({}));
			if (!res.ok) {
				status = j.error ?? 'Failed';
				return;
			}
			status = 'Saved.';
			setTimeout(() => (window.location.href = '/admin/editor'), 400);
		} finally {
			saving = false;
		}
	}

	async function logout() {
		await fetch('/api/admin/logout', { method: 'POST' }).catch(() => null);
		window.location.href = '/admin';
	}
</script>

<div class="wrap">
	<div class="topbar">
		<a href="/">← Site</a>
		<div class="spacer"></div>
		<button class="link" onclick={logout}>Logout</button>
	</div>

	<div class="grid">
		<div class="panel">
			<h2>Posts</h2>
			<div class="list">
				{#each posts as p}
					<button class="item" onclick={() => loadPost(p)}>
						<div class="t">{p.frontmatter.title}</div>
						<div class="d">{p.frontmatter.date}</div>
					</button>
				{/each}
			</div>
		</div>

		<div class="panel editor">
			<h2>Edit</h2>
			<div class="form">
				<label>Slug <input bind:value={slug} placeholder="2026-04-24-welcome" /></label>
				<label>Title <input bind:value={title} /></label>
				<label>Date <input bind:value={date} /></label>
				<label>Excerpt <input bind:value={excerpt} /></label>
				<label>Content <textarea rows="14" bind:value={content}></textarea></label>
				<div class="actions">
					<button onclick={save} disabled={saving || !slug || !title || !date}>
						{saving ? 'Saving…' : 'Save'}
					</button>
					{#if status}<span class="status">{status}</span>{/if}
				</div>
				<p class="note">Writes markdown into the repo. On Vercel, this does NOT persist unless you use GitHub commits (next step).</p>
			</div>
		</div>
	</div>
</div>

<style>
	.wrap {
		min-height: 100vh;
		background: radial-gradient(1200px 700px at 30% 30%, #2a1f1a 0%, #120c09 55%, #070404 100%);
		padding: 22px;
		color: #f7f0e3;
		font-family: ui-serif, Georgia, 'Times New Roman', serif;
	}
	.topbar {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 14px;
	}
	a {
		color: #f7f0e3;
		text-decoration: none;
		opacity: 0.85;
	}
	.spacer {
		flex: 1;
	}
	.link {
		background: transparent;
		border: 0;
		color: #f7f0e3;
		opacity: 0.85;
		cursor: pointer;
	}
	.grid {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: 16px;
	}
	@media (max-width: 900px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
	.panel {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 14px;
		padding: 14px;
		backdrop-filter: blur(10px);
	}
	.list {
		display: grid;
		gap: 10px;
		margin-top: 10px;
	}
	.item {
		text-align: left;
		padding: 10px;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.10);
		background: rgba(255, 255, 255, 0.06);
		cursor: pointer;
	}
	.item:hover {
		background: rgba(255, 255, 255, 0.10);
	}
	.t {
		font-size: 14px;
	}
	.d {
		font-size: 12px;
		opacity: 0.7;
		margin-top: 4px;
	}
	.form {
		display: grid;
		gap: 10px;
		margin-top: 10px;
	}
	label {
		display: grid;
		gap: 6px;
		font-size: 12px;
		opacity: 0.95;
	}
	input,
	textarea {
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(0, 0, 0, 0.18);
		color: #f7f0e3;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 6px;
	}
	button {
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.10);
		padding: 10px 14px;
		border-radius: 10px;
		cursor: pointer;
		color: #f7f0e3;
	}
	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.status {
		font-size: 12px;
		opacity: 0.8;
	}
	.note {
		font-size: 12px;
		opacity: 0.65;
		line-height: 1.5;
	}
</style>
