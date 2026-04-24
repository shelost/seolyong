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
</script>

<div class="wrap">
	<div class="card">
		<h1>Admin</h1>
		<p class="hint">Password-only. Single user.</p>

		<label>
			<span>Password</span>
			<input type="password" bind:value={password} autocomplete="current-password" />
		</label>

		<button onclick={login} disabled={loading || password.length === 0}>
			{loading ? '…' : 'Login'}
		</button>

		{#if errorMsg}
			<p class="err">{errorMsg}</p>
		{/if}
	</div>
</div>

<style>
	.wrap {
		min-height: 100vh;
		display: grid;
		place-items: center;
		background: radial-gradient(1200px 700px at 30% 30%, #2a1f1a 0%, #120c09 55%, #070404 100%);
		padding: 28px;
	}
	.card {
		width: min(420px, 92vw);
		background: linear-gradient(180deg, #fbf2e2 0%, #f2e4cf 100%);
		border: 1px solid rgba(70, 45, 25, 0.25);
		border-radius: 18px;
		box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
		padding: 24px;
		font-family: ui-serif, Georgia, 'Times New Roman', serif;
		color: #24160f;
	}
	.hint {
		margin-top: 6px;
		opacity: 0.7;
	}
	label {
		display: grid;
		gap: 6px;
		margin-top: 18px;
	}
	input {
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid rgba(60, 35, 18, 0.25);
		background: rgba(255, 255, 255, 0.65);
	}
	button {
		margin-top: 14px;
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
	.err {
		margin-top: 12px;
		color: #8b1d1d;
	}
</style>
