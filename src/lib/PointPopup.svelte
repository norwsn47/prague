<script lang="ts">
	import { untrack } from 'svelte';
	import { pointsStore, type SpectatorPoint } from './spectatorPoints.svelte.js';
	import { buildArrivalRows, kmLabel } from './arrivalRows.js';

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

	let name     = $state(untrack(() => point.name));
	let comment  = $state(untrack(() => point.comment));
	let deleting = $state(false);

	const rows = $derived(buildArrivalRows(point));
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

	<!-- Arrival table — sorted by time, one row per runner × distance -->
	{#if rows.length > 0}
		<table style="width:100%; border-collapse:collapse; margin-bottom:10px">
			<thead>
				<tr style="border-bottom:1px solid #E0E0E0">
					<th style="padding:3px 6px 4px 0; text-align:left;  font-size:9px; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#9E9E9E">Name</th>
					<th style="padding:3px 6px 4px 6px; text-align:left;  font-size:9px; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#9E9E9E">KM</th>
					<th style="padding:3px 6px 4px 6px; text-align:right; font-size:9px; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#9E9E9E">Time</th>
					<th style="padding:3px 0 4px 6px; width:20px"></th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row}
					{@const isHidden = pointsStore.isSlotHidden(point.id, row.key)}
					<tr style="
						border-bottom:1px solid #F5F6F4;
						opacity:{isHidden ? 0.35 : 1};
						transition:opacity 0.15s ease;
					">
						<td style="padding:5px 6px 5px 0; font-size:11px; font-weight:600; color:{row.color}">{row.name}</td>
						<td style="padding:5px 6px; font-size:11px; color:#9E9E9E; font-variant-numeric:tabular-nums">{kmLabel(row.distM)}</td>
						<td style="padding:5px 6px; text-align:right; font-size:12px; font-weight:700; color:#2C2C2C; font-variant-numeric:tabular-nums; white-space:nowrap">{row.arrivalStr}</td>
						<td style="padding:5px 0 5px 4px; text-align:right">
							<button
								onclick={() => pointsStore.toggleSlot(point.id, row.key)}
								title={isHidden ? 'Show' : 'Hide'}
								style="
									background:none; border:none; padding:2px; cursor:pointer;
									color:{isHidden ? '#9E9E9E' : '#D0D0D0'};
									display:inline-flex; align-items:center; justify-content:center;
									line-height:0;
								"
							>
								{#if isHidden}
									<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
										<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
										<line x1="1" y1="1" x2="23" y2="23"/>
									</svg>
								{:else}
									<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
										<circle cx="12" cy="12" r="3"/>
									</svg>
								{/if}
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

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
			<svg width="13" height="13" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
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
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none">
				<path d="M9 3h6l1 2H8L9 3z" fill="currentColor"/>
				<rect x="4" y="7" width="16" height="2" rx="1" fill="currentColor"/>
				<path d="M6 10l1.5 11h9L18 10H6zm4 9v-7h1v7h-1zm3 0v-7h1v7h-1z" fill="currentColor"/>
			</svg>
		</button>
	</div>
</div>
