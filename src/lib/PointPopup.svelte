<script lang="ts">
	import { untrack } from 'svelte';
	import { runner1, runner2, formatTime } from './runners.svelte.js';
	import type { SpectatorPoint } from './spectatorPoints.svelte.js';

	let {
		point,
		letter,
		onSave,
		onDelete,
	}: {
		point: SpectatorPoint;
		letter: string;
		onSave: (name: string, comment: string) => void;
		onDelete: () => void;
	} = $props();

	let name    = $state(untrack(() => point.name));
	let comment = $state(untrack(() => point.comment));
	let deleting = $state(false);

	const distances = $derived(
		point.distance_m_2 != null
			? [point.distance_m, point.distance_m_2]
			: [point.distance_m]
	);

	function arrivalAt(distM: number, runner: typeof runner1): string {
		if (!runner.isValid) return '—';
		if (distM >= 42195) return 'finished';
		return formatTime(runner.startSeconds + distM * runner.pacePerMetre);
	}

	function kmLabel(distM: number): string {
		return (distM / 1000).toFixed(1) + ' km';
	}
</script>

<div style="
	width: 100%;
	font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
	box-sizing: border-box;
">
	<!-- Header: letter badge + name input -->
	<div style="display:flex; align-items:center; gap:8px; margin-bottom:9px">
		<span style="
			width:22px; height:22px; border-radius:50%; flex-shrink:0;
			background:#4D8898; color:white;
			display:flex; align-items:center; justify-content:center;
			font-size:11px; font-weight:700;
		">{letter}</span>
		<input
			type="text"
			bind:value={name}
			placeholder="Name this spot…"
			onblur={() => onSave(name, comment)}
			style="
				flex:1; min-width:0; box-sizing:border-box; width:100%;
				border:1.5px solid #E0E0E0; border-radius:6px;
				padding:5px 8px; font-size:12px; color:#2C2C2C;
				outline:none; background:#F5F6F4; font-family:inherit;
			"
		/>
	</div>

	<!-- Notes -->
	<textarea
		bind:value={comment}
		placeholder="Notes…"
		rows="2"
		onblur={() => onSave(name, comment)}
		style="
			display:block; width:100%; box-sizing:border-box;
			border:1.5px solid #E0E0E0; border-radius:6px;
			padding:5px 8px; font-size:11px; color:#2C2C2C;
			resize:none; outline:none; background:#F5F6F4;
			font-family:inherit; margin-bottom:10px;
		"
	></textarea>

	<!-- Arrival times: one block per distance -->
	{#each distances as distM, i}
		<div style="
			background:#F5F6F4; border-radius:6px; padding:7px 10px;
			{i < distances.length - 1 ? 'margin-bottom:6px' : 'margin-bottom:10px'};
		">
			<!-- Distance label -->
			<div style="
				font-size:9px; font-weight:700; letter-spacing:0.07em;
				text-transform:uppercase; color:#9E9E9E; margin-bottom:5px;
			">{distances.length > 1 ? `At ${kmLabel(distM)}` : `Distance: ${kmLabel(distM)}`}</div>

			<!-- Runner rows -->
			{#each [{ r: runner1, color: '#4d7a5f' }, { r: runner2, color: '#9e6080' }] as { r, color }}
				<div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:2px">
					<span style="font-size:11px; font-weight:600; color:{color}">{r.name}</span>
					<span style="
						font-size:12px; font-weight:700; color:#2C2C2C;
						font-variant-numeric:tabular-nums; font-family:inherit;
					">{arrivalAt(distM, r)}</span>
				</div>
			{/each}
		</div>
	{/each}

	<!-- Actions -->
	<div style="display:flex; align-items:center; justify-content:space-between">
		<a
			href="https://maps.google.com/?q={point.lat},{point.lon}"
			target="_blank"
			rel="noopener noreferrer"
			style="
				display:flex; align-items:center; gap:5px;
				color:#4285F4; font-size:11px; font-weight:500;
			"
		>
			<svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
				<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#4285F4"/>
			</svg>
			Open in Google Maps
		</a>
		<button
			onclick={() => { deleting = true; onDelete(); }}
			disabled={deleting}
			style="
				padding:5px; background:none; border:none;
				color:{deleting ? '#E0E0E0' : '#9E9E9E'};
				cursor:{deleting ? 'default' : 'pointer'};
				display:flex; align-items:center; justify-content:center;
			"
			title="Delete"
		>
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M9 3h6l1 2H8L9 3z" fill="currentColor"/>
				<rect x="4" y="7" width="16" height="2" rx="1" fill="currentColor"/>
				<path d="M6 10l1.5 11h9L18 10H6zm4 9v-7h1v7h-1zm3 0v-7h1v7h-1z" fill="currentColor"/>
			</svg>
		</button>
	</div>
</div>
