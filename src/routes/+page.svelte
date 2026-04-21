<script lang="ts">
	import Map from '$lib/Map.svelte';
	import RunnerPanel from '$lib/RunnerPanel.svelte';
	import TimeSlider from '$lib/TimeSlider.svelte';
	import ElevationStrip from '$lib/ElevationStrip.svelte';
	import { runner1, runner2 } from '$lib/runners.svelte.js';

	let mobileRunnerOpen = $state(false);
</script>

<div class="h-dvh flex flex-col lg:flex-row overflow-hidden" style="background:var(--bg)">

	<!-- ── LEFT SIDEBAR (desktop only) ────────────────────────────────────── -->
	<aside
		class="hidden lg:flex lg:flex-col w-80 xl:w-96 shrink-0 border-r"
		style="border-color:var(--border); background:var(--sidebar)"
	>
		<!-- Dark header band -->
		<div class="shrink-0 px-6 py-5" style="background:var(--dark-1)">
			<p class="label-caps" style="color:var(--accent-dark)">Spectator Planner</p>
			<h1 class="mt-1.5 text-xl font-bold tracking-tight" style="color:var(--ti); line-height:1.2">
				Prague Marathon
			</h1>
		</div>

		<!-- Time of day slider — directly below header -->
		<div class="shrink-0" style="border-bottom:1px solid var(--border-s); background:var(--surface)">
			<TimeSlider />
		</div>

		<!-- Runner inputs (scrollable) -->
		<div class="flex-1 overflow-y-auto min-h-0">
			<div class="px-6 pt-5 pb-1">
				<p class="label-caps">Runners</p>
			</div>
			<RunnerPanel sidebar />
		</div>

		<!-- Desktop hint -->
		<div class="shrink-0 px-6 py-3" style="border-top:1px solid var(--border-s)">
			<p style="font-size:11px; color:var(--t3); text-align:center; margin:0">
				Click near the route to add a marker
			</p>
		</div>
	</aside>

	<!-- ── RIGHT / MAIN CONTENT ────────────────────────────────────────────── -->
	<div class="flex-1 flex flex-col min-h-0">

		<!-- Map — fills all available vertical space above the bottom stack -->
		<div class="relative flex-1 min-h-0">
			<Map />
		</div>

		<!-- Desktop: elevation strip -->
		<div class="hidden lg:block shrink-0" style="border-top:1px solid var(--border)">
			<div class="flex items-center px-6 py-2" style="background:var(--dark-2)">
				<span class="label-caps" style="color:var(--t3)">Elevation Profile</span>
			</div>
			<div class="h-36" style="background:var(--surface)">
				<ElevationStrip />
			</div>
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
					padding:0 16px; height:48px;
					background:var(--surface);
				"
			>
				<!-- Runner name + pace summary -->
				<div style="flex:1; display:flex; gap:20px; min-width:0; overflow:hidden">
					{#each [runner1, runner2] as runner}
						<div style="display:flex; align-items:center; gap:6px; min-width:0; overflow:hidden">
							<span style="
								width:8px; height:8px; border-radius:50%;
								background:{runner.hexColor}; flex-shrink:0;
							"></span>
							<span style="
								font-size:12px; font-weight:600; color:var(--t1);
								white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
							">{runner.name}</span>
							{#if runner.raceNumber}
								<span style="font-size:10px; color:var(--t3); white-space:nowrap">({runner.raceNumber})</span>
							{/if}
							{#if runner.paceString}
								<span style="
									font-size:10px; font-family:var(--font-mono);
									color:var(--t3); white-space:nowrap;
								">{runner.paceString}</span>
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

			<!-- Mobile hint -->
			<div style="padding:3px 16px 5px; background:var(--surface)">
				<p style="font-size:10px; color:var(--t3); text-align:center; margin:0">
					Tap near the route to add a marker
				</p>
			</div>

			<!-- Expanded runner inputs — visible only when open -->
			{#if mobileRunnerOpen}
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

			<!-- 2) ELEVATION PROFILE ──────────────────────────────────────────── -->
			<div style="height:80px; border-top:1px solid var(--border-s)">
				<ElevationStrip />
			</div>

			<!-- 3) COMPACT TIME SLIDER — anchored at very bottom ──────────────── -->
			<div style="border-top:1px solid var(--border-s)">
				<TimeSlider compact />
			</div>

		</div>
		<!-- end mobile bottom stack -->

	</div>

</div>
