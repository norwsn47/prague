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
			background:#f59e0b; color:white;
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
				border:1.5px solid #e2e8f0; border-radius:6px;
				padding:5px 8px; font-size:12px; color:#111827;
				outline:none; background:#f8fafc; font-family:inherit;
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
			border:1.5px solid #e2e8f0; border-radius:6px;
			padding:5px 8px; font-size:11px; color:#374151;
			resize:none; outline:none; background:#f8fafc;
			font-family:inherit; margin-bottom:10px;
		"
	></textarea>

	<!-- Arrival times: one block per distance -->
	{#each distances as distM, i}
		<div style="
			background:#f8fafc; border-radius:6px; padding:7px 10px;
			{i < distances.length - 1 ? 'margin-bottom:6px' : 'margin-bottom:10px'};
		">
			<!-- Distance label -->
			<div style="
				font-size:9px; font-weight:700; letter-spacing:0.07em;
				text-transform:uppercase; color:#94a3b8; margin-bottom:5px;
			">{distances.length > 1 ? `At ${kmLabel(distM)}` : `Distance: ${kmLabel(distM)}`}</div>

			<!-- Runner rows -->
			{#each [{ r: runner1, color: '#15803d' }, { r: runner2, color: '#ec4899' }] as { r, color }}
				<div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:2px">
					<span style="font-size:11px; font-weight:600; color:{color}">{r.name}</span>
					<span style="
						font-size:12px; font-weight:700; color:#0f172a;
						font-variant-numeric:tabular-nums; font-family:inherit;
					">{arrivalAt(distM, r)}</span>
				</div>
			{/each}
		</div>
	{/each}

	<!-- Actions -->
	<div style="display:flex; gap:6px">
		<a
			href="https://maps.google.com/?q={point.lat},{point.lon}"
			target="_blank"
			rel="noopener noreferrer"
			style="
				flex:1; text-align:center; padding:6px 0;
				background:#4f46e5; color:white; border-radius:6px;
				font-size:11px; font-weight:600; text-decoration:none; display:block;
			"
		>Google Maps</a>
		<button
			onclick={() => { deleting = true; onDelete(); }}
			disabled={deleting}
			style="
				padding:6px 12px; background:#fff0f0; color:#dc2626;
				border:1.5px solid #fecaca; border-radius:6px;
				font-size:11px; font-weight:600; cursor:pointer; font-family:inherit;
			"
		>{deleting ? '…' : 'Delete'}</button>
	</div>
</div>
