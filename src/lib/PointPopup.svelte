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

	let name = $state(untrack(() => point.name));
	let comment = $state(untrack(() => point.comment));
	let deleting = $state(false);

	const hasTwoCrossings = $derived(point.distance_m_2 != null);

	function arrivalAt(distM: number, runner: typeof runner1): string {
		if (!runner.isValid) return '—';
		if (distM >= 42195) return 'Finished';
		return formatTime(runner.startSeconds + distM * runner.pacePerMetre);
	}

	function handleDelete() {
		deleting = true;
		onDelete();
	}
</script>

<div style="
	width: 230px;
	font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
">
	<!-- Header: letter + name input -->
	<div style="display:flex; align-items:center; gap:8px; margin-bottom:8px">
		<span style="
			width:22px; height:22px; border-radius:50%;
			background:#f59e0b; color:white; flex-shrink:0;
			display:flex; align-items:center; justify-content:center;
			font-size:11px; font-weight:700;
		">{letter}</span>
		<input
			type="text"
			bind:value={name}
			placeholder="Name this spot…"
			onblur={() => onSave(name, comment)}
			style="
				flex:1; min-width:0;
				border:1.5px solid #e2e8f0; border-radius:6px;
				padding:5px 8px; font-size:12px; color:#111827;
				outline:none; background:#f8fafc; font-family:inherit;
				box-sizing:border-box; width:100%;
			"
		/>
	</div>

	<!-- Comment -->
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
			font-family:inherit; margin-bottom:8px;
		"
	></textarea>

	<!-- Arrival times -->
	<div style="
		background:#f8fafc; border-radius:6px;
		padding:6px 10px; margin-bottom:8px;
	">
		{#if hasTwoCrossings}
			<!-- Two-crossing grid: runner | 1st | 2nd -->
			<div style="
				display:grid; grid-template-columns:1fr auto auto;
				gap:2px 10px; align-items:center;
			">
				<!-- Header row -->
				<div></div>
				<span style="font-size:9px; font-weight:700; color:#94a3b8; text-align:right; letter-spacing:0.05em">1ST</span>
				<span style="font-size:9px; font-weight:700; color:#94a3b8; text-align:right; letter-spacing:0.05em">2ND</span>
				<!-- Runner rows -->
				{#each [{ r: runner1, color: '#15803d' }, { r: runner2, color: '#ec4899' }] as { r, color }}
					<span style="font-size:11px; color:{color}; font-weight:600">{r.name}</span>
					<span style="font-size:11px; font-weight:700; color:#1e293b; font-variant-numeric:tabular-nums; text-align:right">
						{arrivalAt(point.distance_m, r)}
					</span>
					<span style="font-size:11px; font-weight:700; color:#1e293b; font-variant-numeric:tabular-nums; text-align:right">
						{arrivalAt(point.distance_m_2!, r)}
					</span>
				{/each}
			</div>
		{:else}
			<!-- Single crossing -->
			<div style="display:flex; flex-direction:column; gap:4px">
				{#each [{ r: runner1, color: '#15803d' }, { r: runner2, color: '#ec4899' }] as { r, color }}
					<div style="display:flex; justify-content:space-between; align-items:center">
						<span style="font-size:11px; color:{color}; font-weight:600">{r.name}</span>
						<span style="font-size:11px; font-weight:700; color:#1e293b; font-variant-numeric:tabular-nums">
							{arrivalAt(point.distance_m, r)}
						</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Actions -->
	<div style="display:flex; gap:6px">
		<a
			href="https://maps.google.com/?q={point.lat},{point.lon}"
			target="_blank"
			rel="noopener noreferrer"
			style="
				flex:1; text-align:center; padding:6px 0;
				background:#4f46e5; color:white; border-radius:6px;
				font-size:11px; font-weight:600; text-decoration:none;
				display:block;
			"
		>Google Maps</a>
		<button
			onclick={handleDelete}
			disabled={deleting}
			style="
				flex:0 0 auto; padding:6px 12px;
				background:#fff0f0; color:#dc2626;
				border:1.5px solid #fecaca; border-radius:6px;
				font-size:11px; font-weight:600; cursor:pointer;
				font-family:inherit;
			"
		>{deleting ? '…' : 'Delete'}</button>
	</div>
</div>
