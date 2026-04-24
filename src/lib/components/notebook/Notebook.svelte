<script lang="ts">
	type Post = {
		slug: string;
		frontmatter: { title: string; date: string; excerpt?: string };
		content: string;
	};

	let { posts }: { posts: Post[] } = $props();

	let opened = $state(false);
	let activeIndex = $state(0);
	let flipping = $state<'none' | 'next' | 'prev'>('none');
	let flipFromIndex = $state(0);
	let flipFromPost = $state<Post | null>(null);

	const FLIP_MS = 760;

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
		// For backward turns, the page that physically animates is the page
		// that was sitting on the LEFT of the spread — i.e. the destination
		// entry. It lifts off the left and swings around the spine onto the
		// right. So flipFromPost is the *previous* post, not the active one.
		flipFromIndex = activeIndex - 1;
		flipFromPost = posts[activeIndex - 1];
		flipping = 'prev';
		activeIndex -= 1;
		setTimeout(() => {
			flipping = 'none';
			flipFromPost = null;
		}, FLIP_MS);
	}

	const active = $derived(posts[activeIndex]);

	function paragraphs(raw: string): string[] {
		if (!raw) return [];
		return raw
			.split(/\n\s*\n/)
			.map((p) => p.trim())
			.filter(Boolean);
	}

	const activeParagraphs = $derived(active ? paragraphs(active.content) : []);
	const flipFromParagraphs = $derived(flipFromPost ? paragraphs(flipFromPost.content) : []);

	function fmt(d: string) {
		if (!d) return '';
		const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
		const dt = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(d);
		if (Number.isNaN(dt.getTime())) return d;
		return dt.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	const activeDate = $derived(active ? fmt(active.frontmatter.date) : '');
	const activeSubtitle = $derived(
		active && active.frontmatter.title && active.frontmatter.title !== activeDate
			? active.frontmatter.title
			: ''
	);
	const flipFromDate = $derived(flipFromPost ? fmt(flipFromPost.frontmatter.date) : '');
	const flipFromSubtitle = $derived(
		flipFromPost &&
			flipFromPost.frontmatter.title &&
			flipFromPost.frontmatter.title !== flipFromDate
			? flipFromPost.frontmatter.title
			: ''
	);

	// The page that sits on the LEFT side of the open book once the user has
	// turned at least one entry. This is a real, fully-rendered page (not a
	// simulated white panel), so its colors and styling match the right page
	// exactly. At index 0 there is no previous, and the cover-back is shown
	// instead.
	const previous = $derived(activeIndex > 0 ? posts[activeIndex - 1] : null);
	const previousParagraphs = $derived(previous ? paragraphs(previous.content) : []);
	const previousDate = $derived(previous ? fmt(previous.frontmatter.date) : '');
	const previousSubtitle = $derived(
		previous && previous.frontmatter.title && previous.frontmatter.title !== previousDate
			? previous.frontmatter.title
			: ''
	);

	function onCoverKey(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			open();
		}
	}

	// Close when the user clicks anywhere outside the book.
	// Mounted only while opened. Defer attachment one tick so the same click
	// that opened the cover doesn't immediately close it.
	$effect(() => {
		if (!opened) return;
		if (typeof document === 'undefined') return;

		let attached = false;
		const onDocPointer = (e: PointerEvent) => {
			const target = e.target as Element | null;
			if (!target) return;
			if (target.closest('.book')) return;
			close();
		};
		const id = window.setTimeout(() => {
			document.addEventListener('pointerdown', onDocPointer);
			attached = true;
		}, 0);

		return () => {
			window.clearTimeout(id);
			if (attached) document.removeEventListener('pointerdown', onDocPointer);
		};
	});

	// Click-to-flip: left half of page → prev, right half → next.
	let downX = 0;
	let downY = 0;
	let downTarget: EventTarget | null = null;

	function isInteractive(el: EventTarget | null): boolean {
		if (!(el instanceof Element)) return false;
		return !!el.closest('button, a, input, textarea, [data-no-flip]');
	}

	// Used by the page-actions row (and any other interactive island) to make
	// sure pointer/click events do NOT bubble up to the page-level flip
	// handlers. Relying on isInteractive() alone is fragile because event
	// retargeting (text nodes, disabled state, slight pointer drift between
	// pointerdown and pointerup) can let the page handler win the race
	// against the button's click. Stopping propagation at the source is
	// bulletproof.
	function stopAll(e: Event) {
		e.stopPropagation();
	}

	function onPageDown(e: PointerEvent) {
		if (e.button !== 0) return;
		downX = e.clientX;
		downY = e.clientY;
		downTarget = e.target;
	}

	function onPageUp(e: PointerEvent) {
		if (e.button !== 0) return;
		if (!opened || flipping !== 'none') return;
		if (isInteractive(downTarget) || isInteractive(e.target)) return;
		const dx = Math.abs(e.clientX - downX);
		const dy = Math.abs(e.clientY - downY);
		if (dx > 6 || dy > 6) return;
		const sel = typeof window !== 'undefined' ? window.getSelection() : null;
		if (sel && sel.toString().length > 0) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const x = e.clientX - rect.left;
		const isLeft = x < rect.width / 2;
		if (isLeft) flipPrev();
		else flipNext();
	}

	// Click anywhere on the left (turned) page → go back one entry. Same
	// quiet-click guards as the right page so text selection / button clicks
	// inside the page don't trigger a flip.
	function onLeftPageUp(e: PointerEvent) {
		if (e.button !== 0) return;
		if (!opened || flipping !== 'none') return;
		if (isInteractive(downTarget) || isInteractive(e.target)) return;
		const dx = Math.abs(e.clientX - downX);
		const dy = Math.abs(e.clientY - downY);
		if (dx > 6 || dy > 6) return;
		const sel = typeof window !== 'undefined' ? window.getSelection() : null;
		if (sel && sel.toString().length > 0) return;
		flipPrev();
	}
</script>

<div class="stage">
	<div class="petals" aria-hidden="true">
		{#each Array(14) as _, i (i)}
			<span class="petal" style="--i: {i}"></span>
		{/each}
	</div>

	<div class="book-perspective">
		<div class="book-float" class:opened>
		<div
			class="book"
			class:opened
			class:flipping-active={flipping !== 'none'}
		>
			<div class="back-cover"></div>

			<div class="page-edge"></div>

			<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
			<div
				class="left-page"
				class:visible={opened && activeIndex > 0 && flipping === 'none'}
				onpointerdown={onPageDown}
				onpointerup={onLeftPageUp}
				aria-label="previous entry"
			>
				{#if previous}
					<div class="page-content">
						<div class="meta">
							<span class="pageno">No. {String(activeIndex).padStart(2, '0')}</span>
							{#if previousSubtitle}
								<span class="subtitle">{previousSubtitle}</span>
							{/if}
						</div>
						<h1>{previousDate}</h1>
						<div class="scroll no-scroll">
							<div class="body">
								{#each previousParagraphs as para}
									<p>{para}</p>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="page"
				class:visible={opened}
				class:hoverable={opened}
				onpointerdown={onPageDown}
				onpointerup={onPageUp}
			>
				{#if active}
					<div class="page-content" data-key={activeIndex}>
						<div class="ribbon"></div>
						<div class="meta">
							<span class="pageno">No. {String(activeIndex + 1).padStart(2, '0')}</span>
							{#if activeSubtitle}
								<span class="subtitle">{activeSubtitle}</span>
							{/if}
						</div>
						<h1>{activeDate}</h1>

						<div class="scroll">
							<div class="body">
								{#each activeParagraphs as para}
									<p>{para}</p>
								{/each}
							</div>
						</div>

						<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
						<div
							class="page-actions"
							data-no-flip
							onpointerdown={stopAll}
							onpointerup={stopAll}
							onclick={stopAll}
						>
							<button
								type="button"
								class="nav"
								onclick={(e) => {
									e.stopPropagation();
									flipPrev();
								}}
								disabled={activeIndex === 0 || flipping !== 'none'}
								aria-label="previous entry"
							>
								← prev
							</button>
							<button
								type="button"
								class="close"
								onclick={(e) => {
									e.stopPropagation();
									close();
								}}
							>
								✕ close
							</button>
							<button
								type="button"
								class="nav"
								onclick={(e) => {
									e.stopPropagation();
									flipNext();
								}}
								disabled={activeIndex === posts.length - 1 || flipping !== 'none'}
								aria-label="next entry"
							>
								next →
							</button>
						</div>

						{#if opened && activeIndex > 0}
							<div class="flip-hint left" aria-hidden="true">‹</div>
						{/if}
						{#if opened && activeIndex < posts.length - 1}
							<div class="flip-hint right" aria-hidden="true">›</div>
						{/if}
					</div>
				{/if}
			</div>

			{#if flipFromPost}
				<div class="flipping-page" class:next={flipping === 'next'} class:prev={flipping === 'prev'}>
					<div class="flip-side front">
						<div class="page-content">
							<div class="ribbon"></div>
							<div class="meta">
								<span class="pageno">No. {String(flipFromIndex + 1).padStart(2, '0')}</span>
								{#if flipFromSubtitle}
									<span class="subtitle">{flipFromSubtitle}</span>
								{/if}
							</div>
							<h1>{flipFromDate}</h1>
							<div class="scroll no-scroll">
								<div class="body">
									{#each flipFromParagraphs as para}
										<p>{para}</p>
									{/each}
								</div>
							</div>
						</div>
					</div>
					<div class="flip-side back"></div>
				</div>
			{/if}

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
							<div class="cover-title">daily devotions</div>
							<div class="cover-author">김설용</div>
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
		min-height: 100dvh;
		display: grid;
		place-items: center;
		background:
			radial-gradient(900px 600px at 50% 30%, var(--blush-1) 0%, var(--blush-2) 55%, var(--blush-3) 100%),
			linear-gradient(180deg, #fff5f8 0%, #f9d8e4 100%);
		overflow: hidden;
		font-family: 'Cormorant Garamond', ui-serif, Georgia, 'Times New Roman', serif;
	}

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
		100% { transform: translate3d(40px, 110dvh, 0) rotate(360deg); }
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

	/* Floating idle animation lives on a wrapper so it never fights the
	   rotation/hover transforms on .book. This is the key to a buttery hover:
	   pausing this wrapper on hover/open avoids any snap-back from the
	   keyframed translateY. */
	.book-float {
		transform-style: preserve-3d;
		animation: bookFloat 6.5s ease-in-out infinite;
		will-change: transform;
	}
	.book-float:hover,
	.book-float.opened {
		animation-play-state: paused;
	}
	@keyframes bookFloat {
		0%, 100% { transform: translate3d(0, 0, 0); }
		50% { transform: translate3d(0, -7px, 0); }
	}

	.book {
		--w: clamp(320px, 36vw, 460px);
		--h: calc(var(--w) * 1.36);
		--depth: 22px;
		position: relative;
		width: var(--w);
		height: var(--h);
		transform-style: preserve-3d;
		transform: rotateX(8deg) rotateY(-14deg);
		transition: transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
		will-change: transform;
	}
	.book.opened {
		transform: rotateX(22deg) rotateY(-2deg) translateZ(40px) translateY(-12px);
		transition: transform 1.1s cubic-bezier(0.65, 0, 0.2, 1);
	}
	.book-float:hover .book:not(.opened) {
		transform: rotateX(6deg) rotateY(-10deg) translateY(-6px);
	}

	.back-cover {
		position: absolute;
		inset: 0;
		transform: translateZ(calc(var(--depth) * -1));
		background: linear-gradient(135deg, var(--rose-2) 0%, var(--rose-deep) 100%);
		border-radius: 6px 8px 8px 6px;
		box-shadow:
			0 36px 80px -18px rgba(168, 90, 118, 0.55),
			0 14px 30px rgba(168, 90, 118, 0.28);
	}

	.page-edge {
		position: absolute;
		top: 6px;
		bottom: 6px;
		right: -2px;
		width: 6px;
		transform: translateZ(calc(var(--depth) * -0.5));
		background: repeating-linear-gradient(
			180deg,
			#fffafc 0px,
			#fffafc 1px,
			#f3d9e3 1px,
			#f3d9e3 2px
		);
		border-radius: 0 4px 4px 0;
		box-shadow: inset -1px 0 0 rgba(168, 90, 118, 0.2);
	}

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
		overflow: hidden;
	}
	.page.visible { opacity: 1; }
	.page.hoverable { cursor: pointer; }

	/* The real "turned" page on the left side of the open book.
	   Same gradient + inset glow as .page so the colors match exactly.
	   - translateX(-100%) puts it to the left of the spine.
	   - translateZ(2px) lifts it just in front of the open cover so it
	     reliably renders on top in 3D (preserve-3d uses real depth).
	   - Mirrored inset shadow on the right edge (where its spine is). */
	.left-page {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 4px;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, transparent 8%),
			linear-gradient(180deg, var(--cream) 0%, var(--cream-edge) 100%);
		box-shadow:
			inset 0 0 60px rgba(202, 122, 147, 0.1),
			inset -8px 0 16px -8px rgba(168, 90, 118, 0.25);
		overflow: hidden;
		transform: translate3d(-100%, 0, 2px);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.4s ease;
		z-index: 7;
	}
	.left-page.visible {
		opacity: 1;
		pointer-events: auto;
		cursor: pointer;
	}

	.page-content {
		position: relative;
		height: 100%;
		padding: clamp(20px, 3vw, 32px);
		color: var(--ink);
		box-sizing: border-box;
		display: grid;
		grid-template-rows: auto auto 1fr auto;
		gap: 12px;
		animation: pageFadeIn 0.55s cubic-bezier(0.5, 0.05, 0.2, 1) both;
	}
	@keyframes pageFadeIn {
		from { opacity: 0; transform: translateY(6px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.ribbon {
		position: absolute;
		top: -8px;
		right: 26px;
		width: 13px;
		height: 70px;
		background: linear-gradient(180deg, var(--gold) 0%, #b78240 100%);
		border-radius: 0 0 6px 6px;
		box-shadow: 0 4px 6px rgba(91, 34, 56, 0.22);
		z-index: 2;
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
		gap: 14px;
		color: var(--ink-soft);
		font-size: 11px;
		letter-spacing: 0.22em;
		text-transform: lowercase;
		font-family: ui-serif, Georgia, serif;
		font-style: italic;
		padding-bottom: 8px;
		border-bottom: 1px solid rgba(168, 90, 118, 0.22);
	}
	.subtitle {
		text-align: right;
		letter-spacing: 0.08em;
		text-transform: none;
	}

	h1 {
		font-family: 'Cormorant Garamond', ui-serif, Georgia, serif;
		font-weight: 500;
		font-size: clamp(22px, 2.4vw, 30px);
		line-height: 1.18;
		margin: 0;
		color: var(--ink);
		letter-spacing: -0.005em;
	}

	.scroll {
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		padding-right: 8px;
		scrollbar-width: thin;
		scrollbar-color: rgba(168, 90, 118, 0.4) transparent;
	}
	.scroll.no-scroll { overflow: hidden; }
	.scroll::-webkit-scrollbar { width: 6px; }
	.scroll::-webkit-scrollbar-track { background: transparent; }
	.scroll::-webkit-scrollbar-thumb {
		background: rgba(168, 90, 118, 0.35);
		border-radius: 3px;
	}
	.scroll::-webkit-scrollbar-thumb:hover {
		background: rgba(168, 90, 118, 0.55);
	}

	.body {
		font-family: ui-serif, Georgia, 'Times New Roman', serif;
		color: var(--ink);
		font-size: clamp(13px, 1vw, 15px);
		line-height: 1.75;
		white-space: pre-wrap;
	}
	.body p {
		margin: 0 0 14px;
	}
	.body p:last-child {
		margin-bottom: 0;
	}

	.page-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 10px;
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

	/* Hover chevron hints — fade in when hovering page, indicating click-to-flip */
	.flip-hint {
		position: absolute;
		top: 50%;
		font-family: ui-serif, Georgia, serif;
		font-size: 36px;
		color: var(--rose-deep);
		opacity: 0;
		transform: translateY(-50%) translateX(0);
		transition: opacity 0.35s ease, transform 0.35s ease;
		pointer-events: none;
		z-index: 4;
		text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
	}
	.flip-hint.left { left: 8px; }
	.flip-hint.right { right: 8px; }
	.page.hoverable:hover .flip-hint.left {
		opacity: 0.4;
		transform: translateY(-50%) translateX(-3px);
	}
	.page.hoverable:hover .flip-hint.right {
		opacity: 0.4;
		transform: translateY(-50%) translateX(3px);
	}

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
	/* Backward turn: the page that animates is the one that was sitting on
	   the LEFT side of the spread. We shift the .flipping-page over to the
	   left half via translateX(-100%) so its right edge (the spine) becomes
	   the rotation pivot. The keyframe must include the same translate as
	   the static rule so it isn't clobbered. */
	.flipping-page.prev {
		transform-origin: right center;
		transform: translateX(-100%);
		animation: flipPrev 0.76s cubic-bezier(0.55, 0, 0.35, 1) forwards;
	}
	@keyframes flipNext {
		from { transform: rotateY(0); }
		to { transform: rotateY(-178deg); }
	}
	@keyframes flipPrev {
		from { transform: translateX(-100%) rotateY(0); }
		to { transform: translateX(-100%) rotateY(178deg); }
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
		background: linear-gradient(180deg, var(--cream-edge) 0%, var(--cream) 100%);
		box-shadow: inset 0 0 60px rgba(202, 122, 147, 0.12);
	}

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
		pointer-events: none;
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
		background: linear-gradient(180deg, #fadce6 0%, #f4c2d2 100%);
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
		gap: 10px;
		align-content: center;
		justify-items: center;
	}
	.cover-title {
		font-family: 'Cormorant Garamond', ui-serif, Georgia, serif;
		font-weight: 500;
		font-size: clamp(26px, 3.2vw, 40px);
		letter-spacing: -1.5px;
		text-transform: lowercase;
		text-shadow: 0 2px 0 rgba(168, 90, 118, 0.4);
		line-height: 1.05;
	}
	.cover-author {
		font-family: 'Cormorant Garamond', ui-serif, Georgia, serif;
		font-weight: 400;
		font-size: clamp(13px, 1.2vw, 16px);
		letter-spacing: 0.32em;
		opacity: 0.88;
		color: #fff;
	}

	.cover-elastic {
		position: absolute;
		top: -10px;
		bottom: -10px;
		right: 16%;
		width: 7px;
		background: linear-gradient(90deg, rgba(91, 34, 56, 0.5) 0%, rgba(91, 34, 56, 0.85) 50%, rgba(91, 34, 56, 0.5) 100%);
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

	@media (max-width: 640px) {
		.book { --w: min(86vw, 340px); }
		.cover-title { font-size: 28px; }
		.page-content { padding: 18px 18px; }
	}

	@media (prefers-reduced-motion: reduce) {
		.book, .book.opened, .book:not(.opened):hover { animation: none; }
		.cover, .flipping-page { transition: none; animation: none; }
		.petal { display: none; }
	}
</style>
