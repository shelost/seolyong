<script lang="ts">
	type Post = {
		slug: string;
		frontmatter: { title: string; date: string; excerpt?: string };
		content: string;
	};

	let { data } = $props();
	const posts = $derived(data.posts as Post[]);

	let editingSlug = $state<string | null>(null);
	let date = $state(todayISO());
	let content = $state('');
	let status = $state<string | null>(null);
	let saving = $state(false);
	let dirty = $state(false);

	function todayISO(): string {
		const d = new Date();
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	}

	function fmtDate(d: string) {
		if (!d) return '';
		const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
		const dt = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(d);
		if (Number.isNaN(dt.getTime())) return d;
		return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	}

	function newEntry() {
		if (dirty && !confirm('discard unsaved changes?')) return;
		editingSlug = null;
		date = todayISO();
		content = '';
		status = null;
		dirty = false;
	}

	async function loadPost(p: Post) {
		if (dirty && !confirm('discard unsaved changes?')) return;
		editingSlug = p.slug;
		date = p.frontmatter.date;
		status = null;
		try {
			const r = await fetch(`/api/admin/post?slug=${encodeURIComponent(p.slug)}`);
			const j = await r.json();
			content = j.content ?? '';
		} catch {
			content = '';
		}
		dirty = false;
	}

	async function save() {
		if (!date || !content.trim()) return;
		saving = true;
		status = null;
		try {
			const res = await fetch('/api/admin/post', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					slug: editingSlug ?? undefined,
					date,
					content
				})
			});
			const j = await res.json().catch(() => ({}));
			if (!res.ok) {
				status = j.error ?? 'failed to save';
				return;
			}
			status = 'saved.';
			dirty = false;
			editingSlug = j.slug ?? editingSlug;
			setTimeout(() => {
				window.location.reload();
			}, 500);
		} finally {
			saving = false;
		}
	}

	async function removeEntry() {
		if (!editingSlug) return;
		if (!confirm('delete this entry permanently?')) return;
		try {
			const res = await fetch(`/api/admin/post?slug=${encodeURIComponent(editingSlug)}`, {
				method: 'DELETE'
			});
			if (!res.ok) {
				status = 'failed to delete';
				return;
			}
			window.location.reload();
		} catch {
			status = 'failed to delete';
		}
	}

	async function logout() {
		await fetch('/api/admin/logout', { method: 'POST' }).catch(() => null);
		window.location.href = '/admin';
	}

	function onContentInput() {
		dirty = true;
	}

	function onDateInput() {
		dirty = true;
	}

	function onKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			save();
		}
	}
</script>

<svelte:head>
	<title>editor · seolyong</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap"
	/>
</svelte:head>

<div class="wrap">
	<header class="topbar">
		<a class="brand" href="/">seolyong</a>
		<div class="spacer"></div>
		<button class="link" onclick={newEntry}>＋ new entry</button>
		<button class="link" onclick={logout}>logout</button>
	</header>

	<div class="grid">
		<aside class="sidebar">
			<div class="sidebar-label">entries</div>
			<div class="list">
				{#each posts as p (p.slug)}
					<button
						type="button"
						class="item"
						class:active={editingSlug === p.slug}
						onclick={() => loadPost(p)}
					>
						<div class="item-date">{fmtDate(p.frontmatter.date)}</div>
						<div class="item-preview">
							{p.frontmatter.excerpt ?? p.content.slice(0, 80)}
						</div>
					</button>
				{/each}
				{#if posts.length === 0}
					<p class="empty">no entries yet.</p>
				{/if}
			</div>
		</aside>

		<main class="editor">
			<div class="ribbon"></div>
			<div class="editor-meta">
				<label class="date-label">
					<span>date</span>
					<input type="date" bind:value={date} oninput={onDateInput} />
				</label>
				<div class="title-preview">{fmtDate(date)}</div>
			</div>

			<textarea
				bind:value={content}
				oninput={onContentInput}
				onkeydown={onKeydown}
				placeholder="write here…"
				spellcheck="false"
			></textarea>

			<footer class="actions">
				{#if editingSlug}
					<button type="button" class="danger" onclick={removeEntry}>delete</button>
				{:else}
					<span></span>
				{/if}
				<div class="status">
					{#if status}<span>{status}</span>{/if}
				</div>
				<button
					type="button"
					class="save"
					onclick={save}
					disabled={saving || !date || !content.trim()}
				>
					{saving ? 'saving…' : editingSlug ? 'save changes' : 'save entry'}
				</button>
			</footer>
		</main>
	</div>
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		background: #fbe2ea;
	}

	.wrap {
		min-height: 100vh;
		background:
			radial-gradient(900px 600px at 50% 30%, #fef0f4 0%, #fbe2ea 55%, #f4cdda 100%),
			linear-gradient(180deg, #fff5f8 0%, #f9d8e4 100%);
		padding: 24px;
		color: #5b2238;
		font-family: 'Cormorant Garamond', ui-serif, Georgia, serif;
		box-sizing: border-box;
	}

	.topbar {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 18px;
	}
	.brand {
		font-family: 'Cormorant Garamond', ui-serif, Georgia, serif;
		font-size: 22px;
		letter-spacing: 0.06em;
		color: #5b2238;
		text-decoration: none;
		font-weight: 500;
	}
	.spacer { flex: 1; }
	.link {
		background: transparent;
		border: 1px solid rgba(168, 90, 118, 0.3);
		color: #a85a76;
		padding: 8px 14px;
		border-radius: 6px;
		cursor: pointer;
		font-family: ui-serif, Georgia, serif;
		font-style: italic;
		font-size: 12px;
		letter-spacing: 0.16em;
		text-transform: lowercase;
		transition: background 0.2s, color 0.2s;
	}
	.link:hover {
		background: rgba(247, 200, 212, 0.4);
		color: #5b2238;
	}

	.grid {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 18px;
		min-height: calc(100vh - 90px);
	}
	@media (max-width: 800px) {
		.grid { grid-template-columns: 1fr; }
	}

	.sidebar {
		background: linear-gradient(180deg, #fffafc 0%, #f5e1ea 100%);
		border-radius: 8px;
		padding: 16px 14px;
		box-shadow:
			0 16px 40px -16px rgba(168, 90, 118, 0.35),
			0 4px 10px rgba(168, 90, 118, 0.12);
		max-height: calc(100vh - 90px);
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(168, 90, 118, 0.4) transparent;
	}
	.sidebar::-webkit-scrollbar { width: 6px; }
	.sidebar::-webkit-scrollbar-thumb { background: rgba(168, 90, 118, 0.35); border-radius: 3px; }

	.sidebar-label {
		font-size: 11px;
		letter-spacing: 0.3em;
		text-transform: lowercase;
		color: #8a4a60;
		font-style: italic;
		font-family: ui-serif, Georgia, serif;
		margin-bottom: 12px;
		border-bottom: 1px solid rgba(168, 90, 118, 0.22);
		padding-bottom: 8px;
	}
	.list {
		display: grid;
		gap: 6px;
	}
	.item {
		text-align: left;
		padding: 10px 12px;
		border-radius: 6px;
		border: 1px solid transparent;
		background: transparent;
		cursor: pointer;
		color: #5b2238;
		font-family: ui-serif, Georgia, serif;
		transition: background 0.2s, border-color 0.2s, transform 0.2s;
	}
	.item:hover {
		background: rgba(247, 200, 212, 0.4);
		transform: translateX(2px);
	}
	.item.active {
		background: rgba(247, 200, 212, 0.55);
		border-color: rgba(168, 90, 118, 0.3);
	}
	.item-date {
		font-size: 13px;
		font-weight: 500;
	}
	.item-preview {
		font-size: 11px;
		opacity: 0.65;
		margin-top: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.empty {
		color: #8a4a60;
		font-style: italic;
		font-size: 13px;
		text-align: center;
		padding: 20px;
		opacity: 0.7;
	}

	.editor {
		position: relative;
		background: linear-gradient(180deg, #fffafc 0%, #f5e1ea 100%);
		border-radius: 8px;
		padding: clamp(20px, 2.5vw, 30px);
		box-shadow:
			0 24px 60px -20px rgba(168, 90, 118, 0.45),
			0 8px 18px rgba(168, 90, 118, 0.18),
			inset 0 0 60px rgba(202, 122, 147, 0.08);
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.ribbon {
		position: absolute;
		top: -10px;
		right: 36px;
		width: 13px;
		height: 70px;
		background: linear-gradient(180deg, #d6a45c 0%, #b78240 100%);
		border-radius: 0 0 6px 6px;
		box-shadow: 0 4px 6px rgba(91, 34, 56, 0.22);
	}
	.ribbon::after {
		content: '';
		position: absolute;
		bottom: -6px;
		left: 0;
		right: 0;
		height: 8px;
		background: #d6a45c;
		clip-path: polygon(0 0, 100% 0, 50% 100%);
	}

	.editor-meta {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 18px;
		padding-bottom: 14px;
		border-bottom: 1px solid rgba(168, 90, 118, 0.22);
	}
	.date-label {
		display: grid;
		gap: 6px;
	}
	.date-label span {
		font-size: 11px;
		letter-spacing: 0.22em;
		text-transform: lowercase;
		color: #8a4a60;
		font-style: italic;
		font-family: ui-serif, Georgia, serif;
	}
	.date-label input {
		padding: 8px 12px;
		border-radius: 6px;
		border: 1px solid rgba(168, 90, 118, 0.25);
		background: rgba(255, 255, 255, 0.75);
		color: #5b2238;
		font-family: ui-serif, Georgia, serif;
		font-size: 14px;
		outline: none;
	}
	.date-label input:focus {
		border-color: rgba(168, 90, 118, 0.55);
		box-shadow: 0 0 0 3px rgba(247, 200, 212, 0.4);
	}
	.title-preview {
		font-family: 'Cormorant Garamond', ui-serif, Georgia, serif;
		font-size: clamp(22px, 2.6vw, 32px);
		color: #5b2238;
		font-weight: 500;
		text-align: right;
		line-height: 1.1;
	}

	textarea {
		flex: 1;
		min-height: 360px;
		width: 100%;
		padding: 18px 20px;
		border-radius: 6px;
		border: 1px solid rgba(168, 90, 118, 0.2);
		background:
			repeating-linear-gradient(
				180deg,
				transparent 0px,
				transparent 27px,
				rgba(168, 90, 118, 0.08) 28px
			),
			rgba(255, 255, 255, 0.6);
		color: #5b2238;
		font-family: ui-serif, Georgia, 'Times New Roman', serif;
		font-size: 16px;
		line-height: 28px;
		resize: vertical;
		outline: none;
		box-sizing: border-box;
		transition: border-color 0.2s, box-shadow 0.2s;
	}
	textarea:focus {
		border-color: rgba(168, 90, 118, 0.5);
		box-shadow: 0 0 0 3px rgba(247, 200, 212, 0.4);
	}
	textarea::placeholder {
		color: rgba(138, 74, 96, 0.4);
		font-style: italic;
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding-top: 8px;
		border-top: 1px dashed rgba(168, 90, 118, 0.22);
	}
	.status {
		flex: 1;
		text-align: center;
		font-style: italic;
		color: #8a4a60;
		font-size: 13px;
		font-family: ui-serif, Georgia, serif;
	}
	.save {
		border: 1px solid rgba(168, 90, 118, 0.35);
		background: linear-gradient(135deg, #f7c8d4 0%, #f0a8bc 100%);
		color: #fff;
		padding: 10px 22px;
		border-radius: 6px;
		cursor: pointer;
		font-family: ui-serif, Georgia, serif;
		font-style: italic;
		letter-spacing: 0.18em;
		text-transform: lowercase;
		font-size: 13px;
		transition: filter 0.2s, transform 0.2s;
		box-shadow: 0 6px 14px rgba(168, 90, 118, 0.28);
	}
	.save:hover:not(:disabled) {
		filter: brightness(1.04);
		transform: translateY(-1px);
	}
	.save:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.danger {
		background: transparent;
		border: 1px solid rgba(168, 90, 118, 0.3);
		color: #a85a76;
		padding: 8px 14px;
		border-radius: 6px;
		cursor: pointer;
		font-family: ui-serif, Georgia, serif;
		font-style: italic;
		font-size: 12px;
		letter-spacing: 0.16em;
		text-transform: lowercase;
		transition: background 0.2s, color 0.2s, border-color 0.2s;
	}
	.danger:hover {
		background: rgba(220, 80, 100, 0.1);
		color: #a82a45;
		border-color: rgba(220, 80, 100, 0.4);
	}
</style>
