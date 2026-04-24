<script lang="ts">
	let { data } = $props();
	const post = $derived(
		data.post as { frontmatter: { title: string; date: string }; content: string }
	);

	function fmt(d: string) {
		if (!d) return '';
		const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
		const dt = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(d);
		if (Number.isNaN(dt.getTime())) return d;
		return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>{post?.frontmatter?.title ?? 'entry'} — seolyong</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap"
	/>
</svelte:head>

<div class="bg">
	<article class="paper">
		<a class="back" href="/">← back to notebook</a>
		<div class="ribbon"></div>
		<div class="meta">{fmt(post.frontmatter.date)}</div>
		<h1>{post.frontmatter.title}</h1>
		<div class="rule"></div>
		<div class="body">{post.content}</div>
	</article>
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		background: #fbe2ea;
	}

	.bg {
		min-height: 100vh;
		background:
			radial-gradient(900px 600px at 50% 20%, #fef0f4 0%, #fbe2ea 55%, #f4cdda 100%),
			linear-gradient(180deg, #fff5f8 0%, #f9d8e4 100%);
		padding: 56px 20px 96px;
		font-family: 'Cormorant Garamond', ui-serif, Georgia, 'Times New Roman', serif;
		color: #5b2238;
		display: grid;
		justify-items: center;
	}

	.paper {
		position: relative;
		width: min(720px, 100%);
		background: linear-gradient(180deg, #fffafc 0%, #f5e1ea 100%);
		border-radius: 8px;
		padding: clamp(28px, 4vw, 48px);
		box-shadow:
			0 24px 60px -20px rgba(168, 90, 118, 0.45),
			0 8px 18px rgba(168, 90, 118, 0.18),
			inset 0 0 60px rgba(202, 122, 147, 0.08);
	}

	.ribbon {
		position: absolute;
		top: -10px;
		right: 36px;
		width: 14px;
		height: 78px;
		background: linear-gradient(180deg, #d6a45c 0%, #b78240 100%);
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
		background: #d6a45c;
		clip-path: polygon(0 0, 100% 0, 50% 100%);
	}

	.back {
		display: inline-block;
		margin-bottom: 22px;
		text-decoration: none;
		color: #a85a76;
		font-style: italic;
		font-size: 13px;
		letter-spacing: 0.18em;
		text-transform: lowercase;
		transition: color 0.2s, transform 0.2s;
	}
	.back:hover {
		color: #5b2238;
		transform: translateX(-2px);
	}

	.meta {
		color: #8a4a60;
		font-style: italic;
		font-size: 13px;
		letter-spacing: 0.22em;
		text-transform: lowercase;
		margin-bottom: 10px;
	}

	h1 {
		font-family: 'Cormorant Garamond', ui-serif, Georgia, serif;
		font-weight: 500;
		font-size: clamp(28px, 4vw, 44px);
		line-height: 1.18;
		margin: 0 0 18px;
		color: #5b2238;
		letter-spacing: -0.005em;
	}

	.rule {
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(168, 90, 118, 0.4), transparent);
		margin-bottom: 24px;
	}

	.body {
		white-space: pre-wrap;
		line-height: 1.8;
		font-size: clamp(16px, 1.2vw, 19px);
		color: #5b2238;
		font-family: ui-serif, Georgia, 'Times New Roman', serif;
	}
</style>
