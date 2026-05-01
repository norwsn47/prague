<script lang="ts">
	import { onMount } from 'svelte';
	import Map from '$lib/Map.svelte';
	import RunnerPanel from '$lib/RunnerPanel.svelte';
	import TimeSlider from '$lib/TimeSlider.svelte';
	import ElevationStrip from '$lib/ElevationStrip.svelte';
	import { runner1, runner2, formatTime } from '$lib/runners.svelte.js';
	import { pointsStore } from '$lib/spectatorPoints.svelte.js';
	import { buildArrivalRows, kmLabel } from '$lib/arrivalRows.js';
	import { WATER_STATIONS } from '$lib/waterStations.js';
	import { unitStore } from '$lib/units.svelte.js';

	onMount(async () => {
		// pointsStore.load() fetches both /api/points and /api/settings in parallel;
		// it returns the raw settings so we can apply runner config here.
		const settings = await pointsStore.load();
		if (settings.runner_1_start) runner1.startTime  = settings.runner_1_start;
		if (settings.runner_1_finish) runner1.finishTime = settings.runner_1_finish;
		if (settings.runner_2_start) runner2.startTime  = settings.runner_2_start;
		if (settings.runner_2_finish) runner2.finishTime = settings.runner_2_finish;
	});

	let viewMode = $state<'planner' | 'spectator'>('planner');
	let spectatorRunner = $state<'will' | 'maggie'>('will');

	const waterArrivalRows = $derived.by(() => {
		const r = spectatorRunner === 'will' ? runner1 : runner2;
		if (!r.isValid) return WATER_STATIONS.map(ws => ({ ...ws, arrivalSecs: 0, arrivalStr: '--' }));
		return WATER_STATIONS.map(ws => {
			const arrivalSecs = r.startSeconds + ws.distM * r.pacePerMetre;
			return { ...ws, arrivalSecs, arrivalStr: formatTime(arrivalSecs) };
		});
	});

	let mobileRunnerOpen = $state(false);
	let expandedIds = $state<Set<string>>(new Set());

	function toggleExpanded(id: string) {
		const next = new Set(expandedIds);
		next.has(id) ? next.delete(id) : next.add(id);
		expandedIds = next;
	}

	function saveRunnerSettings(runnerId: 'will' | 'maggie') {
		const n = runnerId === 'will' ? '1' : '2';
		const r = runnerId === 'will' ? runner1 : runner2;
		fetch('/api/settings', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				[`runner_${n}_start`]:  r.startTime,
				[`runner_${n}_finish`]: r.finishTime,
			}),
		}).catch(() => {});
	}

	function shortFinish(t: string): string {
		const parts = t.split(':');
		return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t;
	}

</script>

<div class="h-dvh flex flex-col lg:flex-row overflow-hidden" style="background:var(--bg)">

	<!-- ── LEFT SIDEBAR (desktop only) ────────────────────────────────────── -->
	<aside
		class="hidden lg:flex lg:flex-col w-80 xl:w-96 shrink-0 border-r"
		style="border-color:var(--border); background:var(--sidebar)"
	>
		<!-- Header bar -->
		<div class="shrink-0 px-6 py-5" style="background:var(--dark-1)">
			<p class="label-caps" style="color:var(--accent-dark)">Spectator Planner</p>
			<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px">
				<h1 class="text-xl font-bold tracking-tight" style="color:var(--ti); line-height:1.2">
					Prague Marathon
				</h1>
				<!-- View mode + unit toggles -->
				<div style="display:flex;align-items:center;gap:4px;flex-shrink:0;margin-left:12px">
					<button
						onclick={() => { viewMode = 'planner'; }}
						style="
							height:28px;padding:0 11px;border-radius:9999px;
							font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;
							cursor:pointer;transition:background 150ms ease,color 150ms ease;
							font-family:var(--font);
							{viewMode === 'planner'
								? 'background:#4D8898;color:white;border:none;'
								: 'background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.65);border:1px solid rgba(255,255,255,0.18);'}
						"
					>Plan</button>
					<button
						onclick={() => { viewMode = 'spectator'; }}
						style="
							height:28px;padding:0 11px;border-radius:9999px;
							font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;
							cursor:pointer;transition:background 150ms ease,color 150ms ease;
							font-family:var(--font);
							{viewMode === 'spectator'
								? 'background:#4D8898;color:white;border:none;'
								: 'background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.65);border:1px solid rgba(255,255,255,0.18);'}
						"
					>Spectate</button>
					<!-- Divider -->
					<span style="width:1px;height:16px;background:rgba(255,255,255,0.20);margin:0 2px;flex-shrink:0"></span>
					<button
						onclick={() => { unitStore.current = 'mi'; }}
						style="
							height:28px;padding:0 9px;border-radius:9999px;
							font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;
							cursor:pointer;transition:background 150ms ease,color 150ms ease;
							font-family:var(--font);
							{unitStore.current === 'mi'
								? 'background:#4D8898;color:white;border:none;'
								: 'background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.65);border:1px solid rgba(255,255,255,0.18);'}
						"
					>mi</button>
					<button
						onclick={() => { unitStore.current = 'km'; }}
						style="
							height:28px;padding:0 9px;border-radius:9999px;
							font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;
							cursor:pointer;transition:background 150ms ease,color 150ms ease;
							font-family:var(--font);
							{unitStore.current === 'km'
								? 'background:#4D8898;color:white;border:none;'
								: 'background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.65);border:1px solid rgba(255,255,255,0.18);'}
						"
					>km</button>
				</div>
			</div>
		</div>
		<!-- 3px Ocean Accent stripe — Outbuild signature detail -->
		<div class="shrink-0" style="height:3px; background:#8AC0BC"></div>

		<!-- Time of day slider — directly below header -->
		<div class="shrink-0" style="border-bottom:1px solid var(--border-s); background:var(--surface)">
			<TimeSlider />
		</div>

		<!-- Runner inputs + spectator list (scrollable) -->
		<div class="flex-1 overflow-y-auto min-h-0">
			<div class="px-6 pt-5 pb-1">
				<p class="label-caps">Runners</p>
			</div>
			<RunnerPanel />

			{#if viewMode === 'planner'}
				<!-- ── PLANNER: spectator points ──────────────────────────────── -->
				<div style="border-top:1px solid var(--border-s); padding:16px 24px 6px">
					<p class="label-caps">Spectator Points</p>
					<p style="margin:4px 0 0; font-size:11px; color:var(--t3); line-height:1.4">
						Click anywhere along the route to add a viewing spot.
					</p>
				</div>

				{#if pointsStore.sorted.length > 0}
					<div style="margin-bottom:8px">
						{#each pointsStore.sorted as point, i}
							{@const letter = String.fromCharCode(65 + i)}
							{@const isFirst = i === 0}
							{@const isLast = i === pointsStore.sorted.length - 1}
							{@const isExpanded = expandedIds.has(point.id)}
							{@const rows = buildArrivalRows(point)}
							<div class="sp-row">
								<!-- Main row -->
								<div style="display:flex; align-items:center; gap:8px; padding:6px 12px 6px 24px">
									<!-- Letter badge -->
									<span style="width:18px;height:18px;border-radius:50%;background:#4D8898;color:white;font-weight:700;font-size:10px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">{letter}</span>

									<!-- Name — clicking opens popup -->
									<button
										onclick={() => { pointsStore.openPopupId = point.id; }}
										style="flex:1;min-width:0;text-align:left;background:none;border:none;padding:0;font-size:12px;font-weight:500;color:var(--t1);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:var(--font)"
									>{point.name || 'Unnamed spot'}</button>

									<!-- Up / down -->
									<div style="display:flex;flex-direction:column;gap:1px;flex-shrink:0">
										<button
											onclick={() => pointsStore.moveUp(point.id)}
											disabled={isFirst}
											aria-label="Move up"
											style="width:18px;height:18px;border:none;background:none;padding:0;cursor:{isFirst ? 'default' : 'pointer'};color:{isFirst ? 'var(--border)' : 'var(--t2)'};display:flex;align-items:center;justify-content:center"
										>
											<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2L9 7H1L5 2Z" fill="currentColor"/></svg>
										</button>
										<button
											onclick={() => pointsStore.moveDown(point.id)}
											disabled={isLast}
											aria-label="Move down"
											style="width:18px;height:18px;border:none;background:none;padding:0;cursor:{isLast ? 'default' : 'pointer'};color:{isLast ? 'var(--border)' : 'var(--t2)'};display:flex;align-items:center;justify-content:center"
										>
											<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 8L1 3H9L5 8Z" fill="currentColor"/></svg>
										</button>
									</div>

									<!-- Expand toggle (only when rows exist) -->
									{#if rows.length > 0}
										<button
											onclick={() => toggleExpanded(point.id)}
											aria-label={isExpanded ? 'Collapse' : 'Expand'}
											style="width:18px;height:18px;border:none;background:none;padding:0;cursor:pointer;color:var(--t2);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform 0.15s;transform:rotate({isExpanded ? 90 : 0}deg)"
										>
											<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 2L7 5L3 8Z" fill="currentColor"/></svg>
										</button>
									{/if}
								</div>

								<!-- Expanded arrival table -->
								{#if isExpanded && rows.length > 0}
									<table style="width:100%;border-collapse:collapse;padding:0 24px 8px;display:table">
										<tbody>
											{#each rows as row}
												{@const isHidden = pointsStore.isSlotHidden(point.id, row.key)}
												<tr style="opacity:{isHidden ? 0.35 : 1};transition:opacity 0.15s ease">
													<td style="padding:3px 6px 3px 24px;font-size:11px;font-weight:600;color:{row.color}">{row.name}</td>
													<td style="padding:3px 6px;font-size:11px;color:#9E9E9E;font-variant-numeric:tabular-nums">{kmLabel(row.distM)}</td>
													<td style="padding:3px 6px;text-align:right;font-size:11px;font-weight:700;color:#2C2C2C;font-variant-numeric:tabular-nums;white-space:nowrap">{row.arrivalStr}</td>
													<td style="padding:3px 12px 3px 4px;text-align:right">
														<button
															onclick={() => pointsStore.toggleSlot(point.id, row.key)}
															title={isHidden ? 'Show' : 'Hide'}
															style="background:none;border:none;padding:2px;cursor:pointer;color:{isHidden ? '#9E9E9E' : '#D0D0D0'};display:inline-flex;align-items:center;justify-content:center;line-height:0"
														>
															{#if isHidden}
																<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
																	<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
																	<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
																	<line x1="1" y1="1" x2="23" y2="23"/>
																</svg>
															{:else}
																<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
							</div>
						{/each}
					</div>
				{/if}
			{:else}
				<!-- ── SPECTATOR: water stations ───────────────────────────────── -->
				<div style="border-top:1px solid var(--border-s); padding:16px 24px 8px">
					<p class="label-caps">Water Stations</p>
					<!-- Runner selector pills -->
					<div style="display:flex;gap:6px;margin-top:10px">
						{#each [{ id: 'will', runner: runner1 }, { id: 'maggie', runner: runner2 }] as { id, runner }}
							<button
								onclick={() => { spectatorRunner = id as 'will' | 'maggie'; }}
								style="
									height:28px;padding:0 14px;border-radius:9999px;
									font-size:11px;font-weight:600;cursor:pointer;
									font-family:var(--font);transition:background 150ms ease,color 150ms ease,border-color 150ms ease;
									{spectatorRunner === id
										? `background:#4D8898;color:white;border:none;`
										: `background:white;color:#2C2C2C;border:1px solid #E0E0E0;`}
								"
							>
								<span style="display:inline-flex;align-items:center;gap:5px">
									<span style="width:7px;height:7px;border-radius:50%;background:{runner.hexColor};flex-shrink:0"></span>
									{runner.name}
								</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Water station list -->
				<div style="margin-bottom:8px">
					{#each waterArrivalRows as ws, i}
						{@const gapMins = (i < waterArrivalRows.length - 1 && ws.arrivalSecs > 0)
							? Math.round((waterArrivalRows[i + 1].arrivalSecs - ws.arrivalSecs) / 60)
							: null}
						<div style="display:flex;align-items:center;gap:8px;padding:3px 24px;border-bottom:1px solid var(--border-s)">
							<svg width="10" height="13" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
								<path d="M6 1C6 1 1 6.5 1 9.5C1 12.5 3.2 14 6 14C8.8 14 11 12.5 11 9.5C11 6.5 6 1 6 1Z" fill="#4D8898" stroke="white" stroke-width="1" stroke-linejoin="round"/>
							</svg>
							<span style="font-size:11px;font-weight:600;color:var(--t1);font-variant-numeric:tabular-nums;white-space:nowrap">
								{unitStore.current === 'mi' ? (ws.distM / 1609.344).toFixed(1) + ' mi' : ws.km + ' km'}{#if gapMins !== null}<span style="font-weight:400;color:#C8C8C8;font-size:10px"> ({gapMins} mins)</span>{/if}
							</span>
							<span style="flex:1"></span>
							<span style="font-size:11px;font-weight:700;color:#2C2C2C;font-variant-numeric:tabular-nums;white-space:nowrap">{ws.arrivalStr}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

	</aside>

	<!-- ── RIGHT / MAIN CONTENT ────────────────────────────────────────────── -->
	<!-- relative here (not on the map div) so the elevation card is outside
	     Leaflet's container — avoids overflow:hidden / z-index interference -->
	<div class="flex-1 flex flex-col min-h-0 relative">

		<!-- Map — isolation:isolate creates a stacking context that contains all of
		     Leaflet's internal z-indices (tiles:200 … controls:800), preventing them
		     from competing with the elevation card (z-index:10) in the parent context -->
		<div class="flex-1 min-h-0" style="isolation:isolate">
			<Map spectatorMode={viewMode === 'spectator'} />
		</div>

		<!-- Desktop: floating elevation card — sibling of map, not nested inside it -->
		<div class="hidden lg:block" style="
			position:absolute;
			bottom:16px;
			left:16px;
			right:16px;
			height:130px;
			background:var(--surface);
			border-radius:12px;
			box-shadow:0 4px 24px rgba(0,0,0,0.14),0 1px 6px rgba(0,0,0,0.08);
			overflow:hidden;
			z-index:10;
			pointer-events:auto;
		">
			<ElevationStrip spectatorMode={viewMode === 'spectator'} />
		</div>

		<!-- ── MOBILE BOTTOM STACK ──────────────────────────────────────────────
		     Order (top→bottom): 1) Runner drawer  2) Elevation  3) Slider
		     shrink-0 = never compresses; map (flex-1 above) absorbs the resize. -->
		<div
			class="lg:hidden shrink-0"
			style="border-top:1px solid var(--border); background:var(--surface)"
		>

			<!-- 1) RUNNER DRAWER ──────────────────────────────────────────────── -->

			<!-- Summary bar — always visible, acts as toggle -->
			<button
				onclick={() => (mobileRunnerOpen = !mobileRunnerOpen)}
				aria-expanded={mobileRunnerOpen}
				style="
					width:100%; border:none; cursor:pointer;
					display:flex; align-items:center; gap:12px;
					padding:10px 16px;
					background:var(--surface);
				"
			>
				<!-- Runner name + finish time — two columns, single row each -->
				<div style="flex:1; display:grid; grid-template-columns:1fr 1fr; gap:8px; min-width:0">
					{#each [runner1, runner2] as runner}
						<div style="display:flex; align-items:center; gap:5px; min-width:0">
							<span style="width:7px;height:7px;border-radius:50%;background:{runner.hexColor};flex-shrink:0"></span>
							<span style="font-size:12px;font-weight:600;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0">{runner.name}</span>
							{#if runner.finishTime}
								<span style="font-size:11px;color:var(--t2);font-variant-numeric:tabular-nums;white-space:nowrap;flex-shrink:0">{shortFinish(runner.finishTime)}</span>
							{/if}
						</div>
					{/each}
				</div>
				<!-- Edit / Done + chevron -->
				<div style="display:flex; align-items:center; gap:5px; flex-shrink:0">
					<span class="label-caps" style="color:var(--accent)">
						{mobileRunnerOpen ? 'Done' : 'Edit'}
					</span>
					<svg
						width="13" height="13" viewBox="0 0 24 24"
						fill="none" stroke="currentColor" stroke-width="2.5"
						stroke-linecap="round" stroke-linejoin="round"
						style="color:var(--t3); transition:transform 0.2s; transform:rotate({mobileRunnerOpen ? 180 : 0}deg)"
					>
						<path d="M19 9l-7 7-7-7"/>
					</svg>
				</div>
			</button>

			<!-- View mode + unit toggle row -->
			<div style="display:flex;justify-content:center;align-items:center;gap:5px;padding:4px 16px 2px;background:var(--surface)">
				<button
					onclick={() => { viewMode = 'planner'; }}
					style="
						height:26px;padding:0 12px;border-radius:9999px;
						font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;
						cursor:pointer;font-family:var(--font);transition:background 150ms ease,color 150ms ease;
						{viewMode === 'planner'
							? 'background:#4D8898;color:white;border:none;'
							: 'background:white;color:#2C2C2C;border:1px solid #E0E0E0;'}
					"
				>Plan</button>
				<button
					onclick={() => { viewMode = 'spectator'; }}
					style="
						height:26px;padding:0 12px;border-radius:9999px;
						font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;
						cursor:pointer;font-family:var(--font);transition:background 150ms ease,color 150ms ease;
						{viewMode === 'spectator'
							? 'background:#4D8898;color:white;border:none;'
							: 'background:white;color:#2C2C2C;border:1px solid #E0E0E0;'}
					"
				>Spectate</button>
				<span style="width:1px;height:14px;background:#E0E0E0;margin:0 1px;flex-shrink:0"></span>
				<button
					onclick={() => { unitStore.current = 'mi'; }}
					style="
						height:26px;padding:0 10px;border-radius:9999px;
						font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;
						cursor:pointer;font-family:var(--font);transition:background 150ms ease,color 150ms ease;
						{unitStore.current === 'mi'
							? 'background:#4D8898;color:white;border:none;'
							: 'background:white;color:#2C2C2C;border:1px solid #E0E0E0;'}
					"
				>mi</button>
				<button
					onclick={() => { unitStore.current = 'km'; }}
					style="
						height:26px;padding:0 10px;border-radius:9999px;
						font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;
						cursor:pointer;font-family:var(--font);transition:background 150ms ease,color 150ms ease;
						{unitStore.current === 'km'
							? 'background:#4D8898;color:white;border:none;'
							: 'background:white;color:#2C2C2C;border:1px solid #E0E0E0;'}
					"
				>km</button>
			</div>

			<!-- Mobile hint — shown only in planner mode -->
			{#if viewMode === 'planner'}
				<div style="padding:3px 16px 5px; background:var(--surface)">
					<p style="font-size:10px; color:var(--t3); text-align:center; margin:0">
						Tap near the route to add a marker
					</p>
				</div>
			{/if}

			<!-- Expanded runner inputs — visible only when open -->
			{#if mobileRunnerOpen}
				{#if viewMode === 'spectator'}
					<!-- Spectator mode: water stations list -->
					<div style="border-top:1px solid var(--border-s); overflow-y:auto; max-height:50vh; background:var(--surface)">
						<!-- Runner selector -->
						<div style="display:flex;gap:6px;padding:10px 16px 8px">
							{#each [{ id: 'will', runner: runner1 }, { id: 'maggie', runner: runner2 }] as { id, runner }}
								<button
									onclick={() => { spectatorRunner = id as 'will' | 'maggie'; }}
									style="
										height:28px;padding:0 14px;border-radius:9999px;
										font-size:11px;font-weight:600;cursor:pointer;
										font-family:var(--font);transition:background 150ms ease,color 150ms ease,border-color 150ms ease;
										{spectatorRunner === id
											? 'background:#4D8898;color:white;border:none;'
											: 'background:white;color:#2C2C2C;border:1px solid #E0E0E0;'}
									"
								>
									<span style="display:inline-flex;align-items:center;gap:5px">
										<span style="width:7px;height:7px;border-radius:50%;background:{runner.hexColor};flex-shrink:0"></span>
										{runner.name}
									</span>
								</button>
							{/each}
						</div>
						<!-- Station rows -->
						{#each waterArrivalRows as ws, i}
							{@const gapMins = (i < waterArrivalRows.length - 1 && ws.arrivalSecs > 0)
								? Math.round((waterArrivalRows[i + 1].arrivalSecs - ws.arrivalSecs) / 60)
								: null}
							<div style="display:flex;align-items:center;gap:8px;padding:3px 16px;border-top:1px solid var(--border-s)">
								<svg width="10" height="13" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
									<path d="M6 1C6 1 1 6.5 1 9.5C1 12.5 3.2 14 6 14C8.8 14 11 12.5 11 9.5C11 6.5 6 1 6 1Z" fill="#4D8898" stroke="white" stroke-width="1" stroke-linejoin="round"/>
								</svg>
								<span style="font-size:11px;font-weight:600;color:var(--t1);font-variant-numeric:tabular-nums;white-space:nowrap">
									{unitStore.current === 'mi' ? (ws.distM / 1609.344).toFixed(1) + ' mi' : ws.km + ' km'}{#if gapMins !== null}<span style="font-weight:400;color:#C8C8C8;font-size:10px"> ({gapMins} mins)</span>{/if}
								</span>
								<span style="flex:1"></span>
								<span style="font-size:11px;font-weight:700;color:#2C2C2C;font-variant-numeric:tabular-nums">{ws.arrivalStr}</span>
							</div>
						{/each}
					</div>
				{:else}
				<!-- Planner mode: runner edit inputs -->
				<div style="border-top:1px solid var(--border-s); overflow-y:auto; max-height:50vh">
					<!-- Two-column grid; minmax(0,1fr) prevents columns from overflowing -->
					<div style="
						display:grid;
						grid-template-columns:repeat(2, minmax(0, 1fr));
						gap:1px;
						background:var(--border-s);
					">
						{#each [
							{ r: runner1, id: 'will'   },
							{ r: runner2, id: 'maggie' },
						] as { r, id }}
							<div style="
								background:var(--surface);
								padding:14px;
								min-width:0;
								overflow:hidden;
								box-sizing:border-box;
							">
								<!-- Name + pace chip -->
								<div style="
									display:flex; align-items:center; gap:6px;
									margin-bottom:10px; min-width:0; overflow:hidden;
								">
									<span style="
										width:7px; height:7px; border-radius:50%;
										background:{r.hexColor}; flex-shrink:0;
									"></span>
									<span style="font-size:12px; font-weight:700; color:var(--t1); white-space:nowrap">
										{r.name}
									</span>
									{#if r.raceNumber}
										<span style="font-size:10px; color:var(--t3); white-space:nowrap">({r.raceNumber})</span>
									{/if}
									{#if r.paceString}
										<span class="pace-chip" style="margin-left:auto; flex-shrink:0">
											{r.paceString}
										</span>
									{/if}
								</div>

								<!-- Start time -->
								<label for="m-start-{id}" class="label-caps" style="display:block; margin-bottom:5px">
									Start
								</label>
								<input
									id="m-start-{id}"
									type="time"
									bind:value={r.startTime}
									onblur={() => saveRunnerSettings(id as 'will' | 'maggie')}
									class="app-input"
									style="min-width:0; width:100%; max-width:100%; box-sizing:border-box"
								/>

								<!-- Finish time -->
								<label
									for="m-finish-{id}"
									class="label-caps"
									style="display:block; margin-top:8px; margin-bottom:5px"
								>
									Finish
								</label>
								<input
									id="m-finish-{id}"
									type="text"
									bind:value={r.finishTime}
									onblur={() => saveRunnerSettings(id as 'will' | 'maggie')}
									placeholder="3:00:00"
									pattern="^\d+:[0-5]\d(:[0-5]\d)?$"
									class="app-input"
									style="min-width:0; width:100%; max-width:100%; box-sizing:border-box"
								/>
							</div>
						{/each}
					</div>
				</div>
				{/if}
			{/if}

			<!-- 2) ELEVATION PROFILE ──────────────────────────────────────────── -->
			<div style="border-top:1px solid var(--border-s); padding:6px 8px 4px; background:var(--bg)">
				<div style="height:76px; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08)">
					<ElevationStrip spectatorMode={viewMode === 'spectator'} />
				</div>
			</div>

			<!-- 3) COMPACT TIME SLIDER — anchored at very bottom ──────────────── -->
			<div style="border-top:1px solid var(--border-s)">
				<TimeSlider compact />
			</div>

		</div>
		<!-- end mobile bottom stack -->

	</div>

</div>

<style>
	.sp-row { cursor: pointer; border-bottom: 1px solid var(--border-s); }
	.sp-row:hover { background: var(--border-s); }
</style>
