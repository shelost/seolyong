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
	let menuOpen = $state(false);

	let selectMode = $state(false);
	let selectedSlugs = $state<Set<string>>(new Set());
	const selectedCount = $derived(selectedSlugs.size);

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
		menuOpen = false;
	}

	async function loadPost(p: Post) {
		if (dirty && !confirm('discard unsaved changes?')) return;
		editingSlug = p.slug;
		date = p.frontmatter.date;
		status = null;
		menuOpen = false;
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

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function enterSelectMode() {
		selectMode = true;
		selectedSlugs = new Set();
	}

	function cancelSelect() {
		selectMode = false;
		selectedSlugs = new Set();
	}

	function toggleSelected(slug: string) {
		const next = new Set(selectedSlugs);
		if (next.has(slug)) next.delete(slug);
		else next.add(slug);
		selectedSlugs = next;
	}

	function onItemClick(p: Post) {
		if (selectMode) toggleSelected(p.slug);
		else loadPost(p);
	}

	async function bulkDelete() {
		const slugs = Array.from(selectedSlugs);
		if (slugs.length === 0) return;
		const word = slugs.length === 1 ? 'entry' : 'entries';
		if (!confirm(`delete ${slugs.length} ${word} permanently?`)) return;

		const results = await Promise.all(
			slugs.map((slug) =>
				fetch(`/api/admin/post?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' })
					.then((r) => r.ok)
					.catch(() => false)
			)
		);
		if (results.every(Boolean)) {
			window.location.reload();
		} else {
			status = 'some entries failed to delete';
			window.location.reload();
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

{#snippet listHeader()}
	{#if selectMode}
		<div class="list-header select-mode">
			<span class="select-count">
				{selectedCount} selected
			</span>
			<div class="select-actions">
				<button
					type="button"
					class="select-action danger"
					onclick={bulkDelete}
					disabled={selectedCount === 0}
				>
					delete
				</button>
				<button type="button" class="select-action" onclick={cancelSelect}>cancel</button>
			</div>
		</div>
	{:else}
		<div class="list-header">
			<span class="list-label">entries</span>
			{#if posts.length > 0}
				<button type="button" class="select-toggle" onclick={enterSelectMode}>select</button>
			{/if}
		</div>
	{/if}
{/snippet}

{#snippet entriesList()}
	<div class="list">
		{#each posts as p (p.slug)}
			{@const isSelected = selectedSlugs.has(p.slug)}
			<button
				type="button"
				class="item"
				class:active={!selectMode && editingSlug === p.slug}
				class:selecting={selectMode}
				class:selected={selectMode && isSelected}
				onclick={() => onItemClick(p)}
				aria-pressed={selectMode ? isSelected : undefined}
			>
				{#if selectMode}
					<span class="checkbox" class:checked={isSelected} aria-hidden="true">
						{#if isSelected}✓{/if}
					</span>
				{/if}
				<span class="item-info">
					<span class="item-date">{fmtDate(p.frontmatter.date)}</span>
					<span class="item-preview">
						{p.frontmatter.excerpt ?? p.content.slice(0, 80)}
					</span>
				</span>
			</button>
		{/each}
		{#if posts.length === 0}
			<p class="empty">no entries yet.</p>
		{/if}
	</div>
{/snippet}

<div class="wrap">
	<header class="topbar">
		<button
			type="button"
			class="hamburger"
			onclick={toggleMenu}
			aria-label="toggle entries menu"
			aria-expanded={menuOpen}
		>
			<span class="bar" class:open={menuOpen}></span>
			<span class="bar" class:open={menuOpen}></span>
			<span class="bar" class:open={menuOpen}></span>
		</button>

		<a class="brand" href="/">seolyong</a>

		<div class="spacer"></div>

		<a class="link diary" href="/">view diary</a>
	</header>

	{#if menuOpen}
		<div class="mobile-menu">
			{@render listHeader()}
			{@render entriesList()}
		</div>
	{/if}

	<div class="grid">
		<aside class="sidebar">
			{@render listHeader()}
			{@render entriesList()}
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

	{#if !selectMode}
		<button
			type="button"
			class="fab"
			onclick={newEntry}
			aria-label="new entry"
			title="new entry"
		>
			<span class="plus" aria-hidden="true">+</span>
		</button>
	{/if}
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
		position: relative;
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
		text-decoration: none;
	}
	.link:hover {
		background: rgba(247, 200, 212, 0.4);
		color: #5b2238;
	}

	/* Hamburger button — only visible on mobile */
	.hamburger {
		display: none;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 4px;
		width: 36px;
		height: 36px;
		background: transparent;
		border: 1px solid rgba(168, 90, 118, 0.3);
		border-radius: 6px;
		cursor: pointer;
		padding: 0;
		transition: background 0.2s, border-color 0.2s;
	}
	.hamburger:hover {
		background: rgba(247, 200, 212, 0.4);
	}
	.hamburger .bar {
		display: block;
		width: 18px;
		height: 1.5px;
		background: #a85a76;
		border-radius: 1px;
		transition: transform 0.25s ease, opacity 0.25s ease;
		transform-origin: center;
	}
	.hamburger .bar.open:nth-child(1) {
		transform: translateY(5.5px) rotate(45deg);
	}
	.hamburger .bar.open:nth-child(2) {
		opacity: 0;
	}
	.hamburger .bar.open:nth-child(3) {
		transform: translateY(-5.5px) rotate(-45deg);
	}

	/* Mobile entries dropdown */
	.mobile-menu {
		display: none;
		background: linear-gradient(180deg, #fffafc 0%, #f5e1ea 100%);
		border-radius: 8px;
		padding: 14px;
		margin-bottom: 16px;
		box-shadow:
			0 16px 40px -16px rgba(168, 90, 118, 0.35),
			0 4px 10px rgba(168, 90, 118, 0.12);
		max-height: 60vh;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(168, 90, 118, 0.4) transparent;
		animation: dropdown 0.25s cubic-bezier(0.5, 0.05, 0.2, 1);
		min-width: 0;
	}
	.mobile-menu::-webkit-scrollbar { width: 6px; }
	.mobile-menu::-webkit-scrollbar-thumb { background: rgba(168, 90, 118, 0.35); border-radius: 3px; }
	@keyframes dropdown {
		from { opacity: 0; transform: translateY(-6px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.grid {
		display: grid;
		grid-template-columns: 280px minmax(0, 1fr);
		gap: 18px;
		min-height: calc(100vh - 90px);
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
		overflow-x: hidden;
		scrollbar-width: thin;
		scrollbar-color: rgba(168, 90, 118, 0.4) transparent;
		min-width: 0;
	}
	.sidebar::-webkit-scrollbar { width: 6px; }
	.sidebar::-webkit-scrollbar-thumb { background: rgba(168, 90, 118, 0.35); border-radius: 3px; }

	/* List header (entries label / select toggle / select-mode actions) */
	.list-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 12px;
		padding-bottom: 8px;
		border-bottom: 1px solid rgba(168, 90, 118, 0.22);
		min-height: 28px;
	}
	.list-header.select-mode {
		gap: 6px;
	}
	.list-label,
	.select-count {
		font-size: 11px;
		letter-spacing: 0.3em;
		text-transform: lowercase;
		color: #8a4a60;
		font-style: italic;
		font-family: ui-serif, Georgia, serif;
	}
	.select-toggle {
		background: none;
		border: none;
		color: #a85a76;
		font-family: ui-serif, Georgia, serif;
		font-style: italic;
		font-size: 11px;
		letter-spacing: 0.22em;
		text-transform: lowercase;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 4px;
		transition: background 0.2s, color 0.2s;
	}
	.select-toggle:hover {
		background: rgba(247, 200, 212, 0.4);
		color: #5b2238;
	}
	.select-actions {
		display: flex;
		gap: 6px;
	}
	.select-action {
		background: none;
		border: 1px solid rgba(168, 90, 118, 0.3);
		color: #a85a76;
		font-family: ui-serif, Georgia, serif;
		font-style: italic;
		font-size: 11px;
		letter-spacing: 0.18em;
		text-transform: lowercase;
		cursor: pointer;
		padding: 4px 10px;
		border-radius: 4px;
		transition: background 0.2s, color 0.2s, border-color 0.2s, opacity 0.2s;
	}
	.select-action:hover:not(:disabled) {
		background: rgba(247, 200, 212, 0.45);
		color: #5b2238;
	}
	.select-action.danger {
		color: #a82a45;
		border-color: rgba(220, 80, 100, 0.4);
	}
	.select-action.danger:hover:not(:disabled) {
		background: rgba(220, 80, 100, 0.12);
		color: #8b1d1d;
	}
	.select-action:disabled {
		opacity: 0.35;
		cursor: default;
	}

	/* Entry list */
	.list {
		display: grid;
		gap: 6px;
	}
	.item {
		display: grid;
		grid-template-columns: 1fr;
		text-align: left;
		padding: 10px 12px;
		border-radius: 6px;
		border: 1px solid transparent;
		background: transparent;
		cursor: pointer;
		color: #5b2238;
		font-family: ui-serif, Georgia, serif;
		transition: background 0.2s, border-color 0.2s, transform 0.2s;
		min-width: 0;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
		overflow: hidden;
	}
	.item.selecting {
		grid-template-columns: 22px 1fr;
		align-items: center;
		gap: 10px;
	}
	.item:hover {
		background: rgba(247, 200, 212, 0.4);
		transform: translateX(2px);
	}
	.item.active {
		background: rgba(247, 200, 212, 0.55);
		border-color: rgba(168, 90, 118, 0.3);
	}
	.item.selected {
		background: rgba(247, 200, 212, 0.55);
		border-color: rgba(168, 90, 118, 0.4);
	}

	/* Selection checkbox (Apple-Notes-like circle) */
	.checkbox {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 1.5px solid rgba(168, 90, 118, 0.5);
		background: rgba(255, 255, 255, 0.6);
		display: grid;
		place-items: center;
		font-size: 12px;
		line-height: 1;
		color: #fff;
		font-weight: 700;
		transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
		flex-shrink: 0;
	}
	.checkbox.checked {
		background: linear-gradient(135deg, #f0a8bc 0%, #e89bb0 100%);
		border-color: #c97a93;
		transform: scale(1.05);
	}

	/* Item content (date + preview) — must own its own overflow */
	.item-info {
		display: block;
		min-width: 0;
		overflow: hidden;
	}
	.item-date {
		display: block;
		font-size: 13px;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}
	.item-preview {
		display: block;
		font-size: 11px;
		opacity: 0.65;
		margin-top: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
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
		min-width: 0;
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

	/* Floating Action Button */
	.fab {
		position: fixed;
		right: clamp(18px, 3vw, 32px);
		bottom: clamp(18px, 3vw, 32px);
		width: 60px;
		height: 60px;
		border-radius: 50%;
		border: 1px solid rgba(168, 90, 118, 0.35);
		background: linear-gradient(135deg, #f7c8d4 0%, #f0a8bc 60%, #e89bb0 100%);
		color: #fff;
		cursor: pointer;
		box-shadow:
			0 14px 30px -8px rgba(168, 90, 118, 0.6),
			0 6px 14px rgba(168, 90, 118, 0.32),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
		display: grid;
		place-items: center;
		transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
		z-index: 50;
	}
	.fab:hover {
		transform: translateY(-2px) scale(1.04);
		filter: brightness(1.05);
		box-shadow:
			0 18px 36px -8px rgba(168, 90, 118, 0.7),
			0 8px 18px rgba(168, 90, 118, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}
	.fab:active {
		transform: translateY(0) scale(0.98);
	}
	.fab .plus {
		font-size: 32px;
		line-height: 1;
		font-family: ui-serif, Georgia, serif;
		font-weight: 300;
		text-shadow: 0 1px 2px rgba(168, 90, 118, 0.4);
	}

	@media (max-width: 800px) {
		.wrap {
			padding: 18px 16px 100px;
		}
		.hamburger {
			display: inline-flex;
		}
		.mobile-menu {
			display: block;
		}
		.grid {
			grid-template-columns: minmax(0, 1fr);
			min-height: calc(100vh - 110px);
		}
		.sidebar {
			display: none;
		}
		.editor {
			padding: 20px 18px;
		}
		.title-preview {
			font-size: 22px;
			text-align: left;
		}
		.editor-meta {
			flex-direction: column;
			align-items: stretch;
			gap: 12px;
		}
		.actions {
			flex-wrap: wrap;
			gap: 10px;
		}
		.status {
			order: 3;
			flex-basis: 100%;
			text-align: left;
		}
	}
</style>
