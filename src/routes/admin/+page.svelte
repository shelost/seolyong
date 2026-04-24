<script lang="ts">
	let password = $state('');
	let errorMsg = $state<string | null>(null);
	let loading = $state(false);

	async function login() {
		loading = true;
		errorMsg = null;
		try {
			const res = await fetch('/api/admin/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ password })
			});
			if (!res.ok) {
				const j = await res.json().catch(() => null);
				errorMsg = j?.error ?? 'Login failed';
				return;
			}
			window.location.href = '/admin/editor';
		} finally {
			loading = false;
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && password.length > 0 && !loading) {
			login();
		}
	}
</script>

<svelte:head>
	<title>admin · seolyong</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap"
	/>
</svelte:head>

<div class="wrap">
	<div class="card">
		<div class="ribbon"></div>
		<h1>admin</h1>
		<p class="hint">tap a quiet word to enter the notebook.</p>

		<label>
			<span>password</span>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				type="password"
				bind:value={password}
				onkeydown={onKeydown}
				autocomplete="current-password"
				autofocus
			/>
		</label>

		<button onclick={login} disabled={loading || password.length === 0}>
			{loading ? '…' : 'enter'}
		</button>

		{#if errorMsg}
			<p class="err">{errorMsg}</p>
		{/if}

		<a class="back" href="/">← back to notebook</a>
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
		display: grid;
		place-items: center;
		background:
			radial-gradient(900px 600px at 50% 30%, #fef0f4 0%, #fbe2ea 55%, #f4cdda 100%),
			linear-gradient(180deg, #fff5f8 0%, #f9d8e4 100%);
		padding: 28px;
		font-family: 'Cormorant Garamond', ui-serif, Georgia, serif;
	}
	.card {
		position: relative;
		width: min(420px, 92vw);
		background: linear-gradient(180deg, #fffafc 0%, #f5e1ea 100%);
		border-radius: 8px;
		box-shadow:
			0 24px 60px -20px rgba(168, 90, 118, 0.45),
			0 8px 18px rgba(168, 90, 118, 0.18),
			inset 0 0 60px rgba(202, 122, 147, 0.08);
		padding: 32px 28px;
		color: #5b2238;
	}
	.ribbon {
		position: absolute;
		top: -10px;
		right: 32px;
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
	h1 {
		margin: 0 0 4px;
		font-weight: 500;
		font-size: 32px;
		letter-spacing: 0.02em;
	}
	.hint {
		margin: 0 0 20px;
		opacity: 0.7;
		font-style: italic;
		font-size: 14px;
		font-family: ui-serif, Georgia, serif;
		letter-spacing: 0.05em;
	}
	label {
		display: grid;
		gap: 8px;
		margin-top: 14px;
	}
	label span {
		font-size: 12px;
		letter-spacing: 0.22em;
		text-transform: lowercase;
		color: #8a4a60;
		font-style: italic;
		font-family: ui-serif, Georgia, serif;
	}
	input {
		padding: 12px 14px;
		border-radius: 6px;
		border: 1px solid rgba(168, 90, 118, 0.25);
		background: rgba(255, 255, 255, 0.75);
		color: #5b2238;
		font-family: ui-serif, Georgia, serif;
		font-size: 15px;
		outline: none;
		transition: border-color 0.2s, box-shadow 0.2s;
	}
	input:focus {
		border-color: rgba(168, 90, 118, 0.55);
		box-shadow: 0 0 0 3px rgba(247, 200, 212, 0.4);
	}
	button {
		margin-top: 18px;
		width: 100%;
		border: 1px solid rgba(168, 90, 118, 0.35);
		background: linear-gradient(135deg, #f7c8d4 0%, #f0a8bc 100%);
		color: #fff;
		padding: 12px 14px;
		border-radius: 6px;
		cursor: pointer;
		font-family: ui-serif, Georgia, serif;
		font-style: italic;
		letter-spacing: 0.18em;
		text-transform: lowercase;
		font-size: 14px;
		transition: filter 0.2s, transform 0.2s;
		box-shadow: 0 6px 14px rgba(168, 90, 118, 0.28);
	}
	button:hover:not(:disabled) {
		filter: brightness(1.04);
		transform: translateY(-1px);
	}
	button:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.err {
		margin-top: 14px;
		color: #8b1d1d;
		font-style: italic;
		font-family: ui-serif, Georgia, serif;
		font-size: 13px;
	}
	.back {
		display: block;
		margin-top: 22px;
		text-align: center;
		text-decoration: none;
		color: #a85a76;
		font-style: italic;
		font-size: 12px;
		letter-spacing: 0.18em;
		text-transform: lowercase;
		font-family: ui-serif, Georgia, serif;
		transition: color 0.2s;
	}
	.back:hover { color: #5b2238; }
</style>
