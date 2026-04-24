<script lang="ts">
	import NotebookIntroThree from '$lib/components/notebook/NotebookIntroThree.svelte';

	let { data } = $props();

	let opened = $state(false);
	let activeIndex = $state(0);

	const posts = $derived(data.posts as Array<{ slug: string; frontmatter: { title: string; date: string; excerpt?: string } }>);
	const active = $derived(posts[activeIndex]);

	function next() {
		activeIndex = Math.min(posts.length - 1, activeIndex + 1);
	}
	function prev() {
		activeIndex = Math.max(0, activeIndex - 1);
	}
</script>

<div class="wrap">
	<NotebookIntroThree open={opened} onClick={() => (opened = true)} />

	{#if opened}
		<div class="paper">
			<div class="paper-inner">
				<div class="meta">
					<div class="title">{active?.frontmatter.title}</div>
					<div class="date">{active?.frontmatter.date}</div>
				</div>

				{#if active?.frontmatter.excerpt}
					<p class="excerpt">{active.frontmatter.excerpt}</p>
				{/if}

				<div class="actions">
					<button onclick={prev} disabled={activeIndex === 0}>Prev</button>
					<a class="read" href={`/post/${active.slug}`}>Open page</a>
					<button onclick={next} disabled={activeIndex === posts.length - 1}>Next</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.wrap {
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		background: radial-gradient(1200px 700px at 30% 30%, #2a1f1a 0%, #120c09 55%, #070404 100%);
	}

	.paper {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 24px;
		pointer-events: none;
	}

	.paper-inner {
		pointer-events: auto;
		width: min(760px, 92vw);
		min-height: 420px;
		background: linear-gradient(180deg, #fbf2e2 0%, #f2e4cf 100%);
		border: 1px solid rgba(70, 45, 25, 0.25);
		border-radius: 18px;
		box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
		padding: 28px 26px;
		font-family: ui-serif, Georgia, 'Times New Roman', serif;
		color: #24160f;
	}

	.meta {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		align-items: baseline;
	}

	.title {
		font-size: 26px;
		letter-spacing: 0.02em;
	}

	.date {
		font-size: 14px;
		opacity: 0.65;
	}

	.excerpt {
		margin-top: 18px;
		font-size: 18px;
		line-height: 1.55;
		opacity: 0.92;
	}

	.actions {
		margin-top: 26px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	button {
		border: 1px solid rgba(60, 35, 18, 0.25);
		background: rgba(255, 255, 255, 0.55);
		padding: 10px 14px;
		border-radius: 10px;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.read {
		text-decoration: none;
		color: #24160f;
		border-bottom: 1px solid rgba(36, 22, 15, 0.35);
		padding-bottom: 2px;
	}
</style>
