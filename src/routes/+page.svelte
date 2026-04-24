<script lang="ts">
	import Notebook from '$lib/components/notebook/Notebook.svelte';

	let { data } = $props();

	type Post = { slug: string; frontmatter: { title: string; date: string; excerpt?: string } };
	const posts = $derived(data.posts as Post[]);
</script>

<svelte:head>
	<title>seolyong</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap"
	/>
</svelte:head>

<main>
	<Notebook {posts} />
</main>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		background: #fbe2ea;
		min-height: 100vh;
		overscroll-behavior: none;
	}
	main {
		display: block;
		width: 100%;
		min-height: 100vh;
	}
</style>
