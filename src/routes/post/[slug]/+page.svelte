<script lang="ts">
	let { data } = $props();
	const post = $derived(data.post as { frontmatter: { title: string; date: string }; content: string });
</script>

<div class="page">
	<a class="back" href="/">← Back</a>
	<h1>{post.frontmatter.title}</h1>
	<div class="date">{post.frontmatter.date}</div>
	<article>{post.content}</article>
</div>

<style>
	.page {
		max-width: 780px;
		margin: 0 auto;
		padding: 48px 20px 72px;
		font-family: ui-serif, Georgia, 'Times New Roman', serif;
		color: #1f140e;
	}
	.back {
		display: inline-block;
		margin-bottom: 18px;
		text-decoration: none;
		color: rgba(31, 20, 14, 0.75);
	}
	.date {
		opacity: 0.6;
		margin-bottom: 24px;
	}
	article {
		white-space: pre-wrap;
		line-height: 1.75;
		font-size: 18px;
	}
</style>
