<script lang="ts">
	import { browser } from '$app/environment';
	import { Canvas, T } from '@threlte/core';
	import { onDestroy } from 'svelte';
	import * as THREE from 'three';

	let {
		open = false,
		onOpen,
		onClick
	}: {
		open?: boolean;
		onOpen?: () => void;
		onClick?: () => void;
	} = $props();

	let progress = $state(0);
	let rafId: number | null = null;
	let lastTs = 0;
	let sentOpen = false;
	let textureReady = $state(false);

	const coverTexture = browser
		? new THREE.TextureLoader().load('/cover.png', (texture) => {
			texture.colorSpace = THREE.SRGBColorSpace;
			texture.anisotropy = 8;
			texture.needsUpdate = true;
			textureReady = true;
		})
		: null;

	function easeInOutCubic(t: number): number {
		return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
	}

	function stopLoop() {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	}

	function startLoop() {
		stopLoop();
		lastTs = 0;

		const tick = (ts: number) => {
			if (!lastTs) lastTs = ts;
			const dt = Math.min(0.05, (ts - lastTs) / 1000);
			lastTs = ts;

			const target = open ? 1 : 0;
			const speed = open ? 1.0 : 1.2;
			progress = THREE.MathUtils.clamp(progress + (target - progress) * dt * speed * 3.2, 0, 1);

			if (open && progress >= 0.8 && !sentOpen) {
				sentOpen = true;
				onOpen?.();
			}

			if (Math.abs(target - progress) < 0.002) {
				progress = target;
				stopLoop();
				return;
			}

			rafId = requestAnimationFrame(tick);
		};

		rafId = requestAnimationFrame(tick);
	}

	$effect(() => {
		sentOpen = false;
		if (browser) startLoop();
	});

	onDestroy(() => {
		stopLoop();
	});

	const eased = $derived(easeInOutCubic(progress));
	const coverRotationY = $derived(-0.25 - eased * 2.35);
	const bookScale = $derived(0.88 + eased * 0.42);
	const bookPositionZ = $derived(eased * 3.0);
	const bookTiltX = $derived(-0.06 + eased * 0.02);
	const clickable = $derived(!open);
</script>

{#if browser}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="three-wrap" class:clickable aria-hidden="true" onpointerdown={clickable ? onClick : undefined}>
		<Canvas dpr={1.5}>
			<T.PerspectiveCamera makeDefault position={[0, 0.36, 11.2]} fov={36} />
			<T.HemisphereLight skyColor="#f7f0e3" groundColor="#6a4b35" intensity={0.9} />
			<T.AmbientLight intensity={0.85} />
			<T.DirectionalLight position={[2, 3, 4]} intensity={0.72} color="#ffe9cf" />
			<T.DirectionalLight position={[-2.5, 2, -2]} intensity={0.35} color="#f3d8bf" />

			<T.Group scale={bookScale} rotation.x={bookTiltX} position.z={bookPositionZ}>
				<T.Mesh position={[0, -0.04, -0.22]}>
					<T.BoxGeometry args={[3.35, 4.8, 0.34]} />
					<T.MeshStandardMaterial color="#efe2cc" roughness={0.95} metalness={0.0} />
				</T.Mesh>

				<T.Mesh position={[-1.78, 0, 0]}>
					<T.BoxGeometry args={[0.18, 4.95, 0.42]} />
					<T.MeshStandardMaterial color="#4c2f1f" roughness={0.92} metalness={0.0} />
				</T.Mesh>

				<T.Group position={[-1.72, 0, 0.02]} rotation.y={coverRotationY}>
					<T.Mesh position={[1.65, 0, 0]}>
						<T.BoxGeometry args={[3.25, 4.95, 0.1]} />
						<T.MeshStandardMaterial color="#6b4330" roughness={0.94} metalness={0.0} />
					</T.Mesh>

					<T.Mesh position={[1.65, 0, 0.055]}>
						<T.PlaneGeometry args={[2.65, 3.85]} />
						<T.MeshStandardMaterial
							transparent
							opacity={textureReady ? 1 : 0}
							map={coverTexture}
							roughness={0.98}
							metalness={0.0}
							side={THREE.DoubleSide}
							color="#fff8ea"
						/>
					</T.Mesh>
				</T.Group>
			</T.Group>
		</Canvas>
		{#if !textureReady}
			<div class="fallback">Notebook</div>
		{/if}
	</div>
{/if}

<style>
	.three-wrap {
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		position: relative;
	}

	.three-wrap.clickable {
		pointer-events: auto;
		cursor: pointer;
	}

	.fallback {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		font-family: ui-serif, Georgia, 'Times New Roman', serif;
		color: rgba(250, 240, 225, 0.9);
		letter-spacing: 0.06em;
		text-shadow: 0 8px 18px rgba(30, 18, 10, 0.45);
		pointer-events: none;
		font-size: 28px;
	}
</style>
