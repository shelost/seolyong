<script lang="ts">
	type Post = {
		slug: string;
		frontmatter: { title: string; date: string; excerpt?: string };
	};

	let { posts }: { posts: Post[] } = $props();

	let opened = $state(false);
	let activeIndex = $state(0);
	let flipping = $state<'none' | 'next' | 'prev'>('none');
	let flipFromIndex = $state(0);
	let flipFromPost = $state<Post | null>(null);

	const FLIP_MS = 760;
	const OPEN_MS = 1150;

	function open() {
		if (opened) return;
		opened = true;
	}

	function close() {
		if (!opened) return;
		opened = false;
	}

	function flipNext() {
		if (flipping !== 'none' || activeIndex >= posts.length - 1) return;
		flipFromIndex = activeIndex;
		flipFromPost = posts[activeIndex];
		flipping = 'next';
		activeIndex += 1;
		setTimeout(() => {
			flipping = 'none';
			flipFromPost = null;
		}, FLIP_MS);
	}

	function flipPrev() {
		if (flipping !== 'none' || activeIndex <= 0) return;
		flipFromIndex = activeIndex;
		flipFromPost = posts[activeIndex];
		flipping = 'prev';
		activeIndex -= 1;
		setTimeout(() => {
			flipping = 'none';
			flipFromPost = null;
		}, FLIP_MS);
	}

	const active = $derived(posts[activeIndex]);

	function fmt(d: string) {
		if (!d) return '';
		const dt = new Date(d);
		if (Number.isNaN(dt.getTime())) return d;
		return dt.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function onCoverKey(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			open();
		}
	}
</script>

<div class="stage">
	<div class="petals" aria-hidden="true">
		{#each Array(14) as _, i (i)}
			<span class="petal" style="--i: {i}"></span>
		{/each}
	</div>

	<div class="book-perspective">
		<div class="book" class:opened class:flipping-active={flipping !== 'none'}>
			<!-- Back cover (depth) -->
			<div class="back-cover"></div>

			<!-- Page edge (paper thickness) -->
			<div class="page-edge"></div>

			<!-- The active page sitting inside the notebook -->
			<div class="page" class:visible={opened}>
				{#if active}
					<div class="page-content" data-key={activeIndex}>
						<div class="ribbon"></div>
						<div class="meta">
							<span class="date">{fmt(active.frontmatter.date)}</span>
							<span class="pageno">No. {String(activeIndex + 1).padStart(2, '0')}</span>
						</div>
						<h1>{active.frontmatter.title}</h1>
						{#if active.frontmatter.excerpt}
							<p class="excerpt">{active.frontmatter.excerpt}</p>
						{/if}
						<a class="read" href={`/post/${active.slug}`}>read this entry →</a>

						<div class="page-actions">
							<button
								type="button"
								class="nav"
								onclick={flipPrev}
								disabled={activeIndex === 0 || flipping !== 'none'}
							>
								← prev
							</button>
							<button type="button" class="close" onclick={close}>✕ close</button>
							<button
								type="button"
								class="nav"
								onclick={flipNext}
								disabled={activeIndex === posts.length - 1 || flipping !== 'none'}
							>
								next →
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Flipping page overlay (renders the OLD content rotating away) -->
			{#if flipFromPost}
				<div class="flipping-page" class:next={flipping === 'next'} class:prev={flipping === 'prev'}>
					<div class="flip-side front">
						<div class="page-content">
							<div class="ribbon"></div>
							<div class="meta">
								<span class="date">{fmt(flipFromPost.frontmatter.date)}</span>
								<span class="pageno">No. {String(flipFromIndex + 1).padStart(2, '0')}</span>
							</div>
							<h1>{flipFromPost.frontmatter.title}</h1>
							{#if flipFromPost.frontmatter.excerpt}
								<p class="excerpt">{flipFromPost.frontmatter.excerpt}</p>
							{/if}
						</div>
					</div>
					<div class="flip-side back"></div>
				</div>
			{/if}

			<!-- Front cover (rotates open) -->
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div
				class="cover"
				class:opened
				onclick={open}
				role="button"
				tabindex={opened ? -1 : 0}
				aria-label={opened ? 'notebook open' : 'open notebook'}
				onkeydown={onCoverKey}
			>
				<div class="cover-face front">
					<div class="cover-frame">
						<div class="ornament">— ✦ —</div>
						<div class="cover-title-block">
							<div class="cover-title">seolyong</div>
							<div class="cover-sub">a soft notebook</div>
						</div>
						<div class="ornament">— ✿ —</div>
					</div>
					<div class="cover-elastic"></div>
					<div class="cover-glow"></div>
				</div>
				<div class="cover-face back">
					<div class="cover-liner"></div>
					<div class="cover-stamp">
						<div class="stamp-line"></div>
						<div class="stamp-text">
							if found,<br />please return<br />with kindness
						</div>
						<div class="stamp-line"></div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="hint" class:hide={opened}>tap the cover to open</div>
</div>

<style>
	.stage {
		--blush-1: #fef0f4;
		--blush-2: #fbe2ea;
		--blush-3: #f4cdda;
		--rose: #f7c8d4;
		--rose-2: #f0a8bc;
		--rose-deep: #c97a93;
		--rose-shadow: #a85a76;
		--cream: #fffafc;
		--cream-edge: #f5e1ea;
		--ink: #5b2238;
		--ink-soft: #8a4a60;
		--gold: #d6a45c;

		position: relative;
		width: 100%;
		min-height: 100vh;
		display: grid;
		place-items: center;
		background:
			radial-gradient(900px 600px at 50% 30%, var(--blush-1) 0%, var(--blush-2) 55%, var(--blush-3) 100%),
			linear-gradient(180deg, #fff5f8 0%, #f9d8e4 100%);
		overflow: hidden;
		font-family: 'Cormorant Garamond', ui-serif, Georgia, 'Times New Roman', serif;
	}

	/* ambient drifting petals */
	.petals {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}
	.petal {
		position: absolute;
		top: -40px;
		left: calc((var(--i) * 7.3%) + 4%);
		width: 10px;
		height: 14px;
		border-radius: 60% 40% 60% 40% / 70% 60% 40% 30%;
		background: linear-gradient(135deg, #fadbe5 0%, #f3b9cb 100%);
		opacity: 0.55;
		filter: blur(0.5px);
		animation: drift calc(18s + var(--i) * 1.7s) linear infinite;
		animation-delay: calc(var(--i) * -2.4s);
	}
	@keyframes drift {
		0% { transform: translate3d(0, -40px, 0) rotate(0deg); }
		100% { transform: translate3d(40px, 110vh, 0) rotate(360deg); }
	}

	.hint {
		position: absolute;
		bottom: 38px;
		left: 50%;
		transform: translateX(-50%);
		font-style: italic;
		color: var(--rose-shadow);
		letter-spacing: 0.22em;
		text-transform: lowercase;
		font-size: 12px;
		opacity: 0.85;
		transition: opacity 0.45s ease;
		font-family: ui-serif, Georgia, serif;
	}
	.hint.hide { opacity: 0; pointer-events: none; }

	.book-perspective {
		perspective: 2400px;
		perspective-origin: 50% 38%;
	}

	/* the book itself — single-page width (portrait notebook) */
	.book {
		--w: clamp(280px, 32vw, 420px);
		--h: calc(var(--w) * 1.36);
		--depth: 22px;
		position: relative;
		width: var(--w);
		height: var(--h);
		transform-style: preserve-3d;
		transform: rotateX(8deg) rotateY(-14deg) translateZ(0);
		transition: transform 1.15s cubic-bezier(0.7, 0, 0.2, 1);
		will-change: transform;
		animation: float 6.5s ease-in-out infinite;
	}
	.book.opened {
		transform: rotateX(22deg) rotateY(-2deg) translateZ(40px) translateY(-12px);
		animation: none;
	}
	.book:not(.opened):hover {
		transform: rotateX(6deg) rotateY(-10deg) translateY(-8px);
		animation: none;
	}
	@keyframes float {
		0%, 100% { transform: rotateX(8deg) rotateY(-14deg) translateY(0); }
		50% { transform: rotateX(8deg) rotateY(-14deg) translateY(-7px); }
	}

	/* back cover — gives a sense of book depth */
	.back-cover {
		position: absolute;
		inset: 0;
		transform: translateZ(calc(var(--depth) * -1));
		background:
			linear-gradient(135deg, var(--rose-2) 0%, var(--rose-deep) 100%);
		border-radius: 6px 8px 8px 6px;
		box-shadow:
			0 36px 80px -18px rgba(168, 90, 118, 0.55),
			0 14px 30px rgba(168, 90, 118, 0.28);
	}

	/* paper-thickness edge on the right side */
	.page-edge {
		position: absolute;
		top: 6px;
		bottom: 6px;
		right: -2px;
		width: 6px;
		transform: translateZ(calc(var(--depth) * -0.5));
		background:
			repeating-linear-gradient(
				180deg,
				#fffafc 0px,
				#fffafc 1px,
				#f3d9e3 1px,
				#f3d9e3 2px
			);
		border-radius: 0 4px 4px 0;
		box-shadow: inset -1px 0 0 rgba(168, 90, 118, 0.2);
	}

	/* the page content sits inside the book */
	.page {
		position: absolute;
		inset: 0;
		border-radius: 4px;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, transparent 8%),
			linear-gradient(180deg, var(--cream) 0%, var(--cream-edge) 100%);
		box-shadow:
			inset 0 0 60px rgba(202, 122, 147, 0.1),
			inset 8px 0 16px -8px rgba(168, 90, 118, 0.25);
		opacity: 0;
		transition: opacity 0.5s ease 0.55s;
	}
	.page.visible { opacity: 1; }

	.page-content {
		position: relative;
		height: 100%;
		padding: clamp(22px, 3.4vw, 38px);
		color: var(--ink);
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		animation: pageFadeIn 0.55s cubic-bezier(0.5, 0.05, 0.2, 1) both;
	}
	@keyframes pageFadeIn {
		from { opacity: 0; transform: translateY(6px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.ribbon {
		position: absolute;
		top: -8px;
		right: 28px;
		width: 14px;
		height: 78px;
		background: linear-gradient(180deg, var(--gold) 0%, #b78240 100%);
		border-radius: 0 0 7px 7px;
		box-shadow: 0 4px 6px rgba(91, 34, 56, 0.22);
	}
	.ribbon::after {
		content: '';
		position: absolute;
		bottom: -6px;
		left: 0;
		right: 0;
		height: 8px;
		background: var(--gold);
		clip-path: polygon(0 0, 100% 0, 50% 100%);
	}

	.meta {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		color: var(--ink-soft);
		font-size: 11px;
		letter-spacing: 0.22em;
		text-transform: lowercase;
		font-family: ui-serif, Georgia, serif;
		font-style: italic;
		margin-bottom: 16px;
		border-bottom: 1px solid rgba(168, 90, 118, 0.22);
		padding-bottom: 10px;
	}

	h1 {
		font-family: 'Cormorant Garamond', ui-serif, Georgia, serif;
		font-weight: 500;
		font-size: clamp(24px, 2.8vw, 36px);
		line-height: 1.18;
		margin: 0 0 14px;
		color: var(--ink);
		letter-spacing: -0.005em;
	}

	.excerpt {
		font-size: clamp(14px, 1.15vw, 17px);
		line-height: 1.65;
		color: var(--ink);
		opacity: 0.92;
		margin: 0 0 22px;
		font-style: italic;
		font-family: ui-serif, Georgia, serif;
	}

	.read {
		display: inline-block;
		color: var(--rose-shadow);
		text-decoration: none;
		border-bottom: 1px solid rgba(168, 90, 118, 0.4);
		padding-bottom: 2px;
		font-style: italic;
		font-family: ui-serif, Georgia, serif;
		font-size: 14px;
		transition: color 0.2s, border-color 0.2s, transform 0.2s;
		align-self: flex-start;
	}
	.read:hover {
		color: var(--ink);
		border-color: var(--ink);
		transform: translateX(2px);
	}

	.page-actions {
		margin-top: auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 18px;
		border-top: 1px dashed rgba(168, 90, 118, 0.25);
	}
	.nav, .close {
		background: none;
		border: none;
		color: var(--rose-shadow);
		font-family: ui-serif, Georgia, serif;
		font-style: italic;
		font-size: 12px;
		letter-spacing: 0.18em;
		text-transform: lowercase;
		cursor: pointer;
		padding: 6px 8px;
		border-radius: 4px;
		transition: color 0.2s, background 0.2s;
	}
	.nav:hover:not(:disabled), .close:hover {
		color: var(--ink);
		background: rgba(247, 200, 212, 0.45);
	}
	.nav:disabled { opacity: 0.3; cursor: default; }

	/* flipping page overlay */
	.flipping-page {
		position: absolute;
		inset: 0;
		transform-style: preserve-3d;
		z-index: 6;
		pointer-events: none;
		will-change: transform;
	}
	.flipping-page.next {
		transform-origin: left center;
		animation: flipNext 0.76s cubic-bezier(0.55, 0, 0.35, 1) forwards;
	}
	.flipping-page.prev {
		transform-origin: right center;
		animation: flipPrev 0.76s cubic-bezier(0.55, 0, 0.35, 1) forwards;
	}
	@keyframes flipNext {
		from { transform: rotateY(0); }
		to { transform: rotateY(-178deg); }
	}
	@keyframes flipPrev {
		from { transform: rotateY(0); }
		to { transform: rotateY(178deg); }
	}

	.flip-side {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
		border-radius: 4px;
		overflow: hidden;
	}
	.flip-side.front {
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, transparent 8%),
			linear-gradient(180deg, var(--cream) 0%, var(--cream-edge) 100%);
		box-shadow:
			inset 0 0 60px rgba(202, 122, 147, 0.1),
			0 4px 18px rgba(168, 90, 118, 0.18);
	}
	.flip-side.back {
		transform: rotateY(180deg);
		background:
			linear-gradient(180deg, var(--cream-edge) 0%, var(--cream) 100%);
		box-shadow:
			inset 0 0 60px rgba(202, 122, 147, 0.12);
	}

	/* ===== Front Cover ===== */
	.cover {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		transform-origin: left center;
		transform-style: preserve-3d;
		cursor: pointer;
		transition: transform 1.15s cubic-bezier(0.65, 0, 0.2, 1);
		will-change: transform;
		z-index: 10;
	}
	.cover.opened {
		transform: rotateY(-172deg);
		cursor: default;
	}

	.cover-face {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
		border-radius: 6px;
		overflow: hidden;
	}

	.cover-face.front {
		background:
			radial-gradient(140% 90% at 30% 25%, rgba(255, 255, 255, 0.28) 0%, transparent 55%),
			linear-gradient(135deg, var(--rose) 0%, var(--rose-2) 55%, var(--rose-deep) 100%);
		box-shadow:
			inset 0 0 0 2px rgba(255, 255, 255, 0.22),
			inset 0 0 90px rgba(168, 90, 118, 0.32),
			0 26px 56px -10px rgba(168, 90, 118, 0.55),
			0 8px 18px rgba(168, 90, 118, 0.28);
		display: grid;
		place-items: center;
		color: #fff;
	}

	.cover-face.back {
		transform: rotateY(180deg);
		background:
			linear-gradient(180deg, #fadce6 0%, #f4c2d2 100%);
		box-shadow: inset 0 0 60px rgba(168, 90, 118, 0.28);
		display: grid;
		place-items: center;
	}

	.cover-frame {
		width: 78%;
		height: 82%;
		border: 1px solid rgba(255, 255, 255, 0.55);
		border-radius: 4px;
		display: grid;
		grid-template-rows: auto 1fr auto;
		justify-items: center;
		align-items: center;
		padding: 22px 14px;
		text-align: center;
		box-sizing: border-box;
		position: relative;
	}
	.cover-frame::before, .cover-frame::after {
		content: '';
		position: absolute;
		width: 14px;
		height: 14px;
		border: 1px solid rgba(255, 255, 255, 0.55);
	}
	.cover-frame::before {
		top: -1px; left: -1px;
		border-right: none; border-bottom: none;
	}
	.cover-frame::after {
		bottom: -1px; right: -1px;
		border-left: none; border-top: none;
	}

	.ornament {
		color: rgba(255, 255, 255, 0.85);
		letter-spacing: 0.4em;
		font-size: 13px;
		font-family: ui-serif, Georgia, serif;
	}

	.cover-title-block {
		display: grid;
		gap: 8px;
		align-content: center;
	}
	.cover-title {
		font-family: 'Cormorant Garamond', ui-serif, Georgia, serif;
		font-weight: 500;
		font-size: clamp(30px, 3.6vw, 46px);
		letter-spacing: 0.05em;
		text-shadow: 0 2px 0 rgba(168, 90, 118, 0.4);
	}
	.cover-sub {
		font-style: italic;
		opacity: 0.92;
		letter-spacing: 0.2em;
		font-size: 12px;
		text-transform: lowercase;
		font-family: ui-serif, Georgia, serif;
	}

	.cover-elastic {
		position: absolute;
		top: -10px;
		bottom: -10px;
		right: 16%;
		width: 7px;
		background:
			linear-gradient(90deg, rgba(91, 34, 56, 0.5) 0%, rgba(91, 34, 56, 0.85) 50%, rgba(91, 34, 56, 0.5) 100%);
		border-radius: 4px;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
	}

	.cover-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.18), transparent 50%);
		pointer-events: none;
	}

	.cover-liner {
		position: absolute;
		inset: 18px;
		border: 1px dashed rgba(168, 90, 118, 0.45);
		border-radius: 3px;
	}

	.cover-stamp {
		display: grid;
		gap: 12px;
		justify-items: center;
		color: var(--rose-shadow);
		font-family: ui-serif, Georgia, serif;
		font-style: italic;
		text-align: center;
		opacity: 0.8;
	}
	.stamp-line {
		width: 38px;
		height: 1px;
		background: var(--rose-shadow);
		opacity: 0.5;
	}
	.stamp-text {
		font-size: 12px;
		letter-spacing: 0.16em;
		text-transform: lowercase;
		line-height: 1.7;
	}

	/* mobile */
	@media (max-width: 640px) {
		.book { --w: min(82vw, 320px); }
		.cover-title { font-size: 28px; }
		.page-content { padding: 22px 20px; }
	}

	@media (prefers-reduced-motion: reduce) {
		.book, .book.opened, .book:not(.opened):hover { animation: none; }
		.cover, .flipping-page { transition: none; animation: none; }
		.petal { display: none; }
	}
</style>
