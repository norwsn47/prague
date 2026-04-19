<script lang="ts">
	import Map from '$lib/Map.svelte';
	import RunnerPanel from '$lib/RunnerPanel.svelte';
	import TimeSlider from '$lib/TimeSlider.svelte';
	import ElevationStrip from '$lib/ElevationStrip.svelte';
</script>

<div class="h-dvh flex flex-col lg:flex-row overflow-hidden" style="background:var(--bg)">

	<!-- ── LEFT SIDEBAR (desktop only) ─────────────────────────────────────── -->
	<aside
		class="hidden lg:flex lg:flex-col w-80 xl:w-88 shrink-0 border-r"
		style="border-color:var(--border); background:var(--sidebar)"
	>

		<!-- Dark header band -->
		<div class="shrink-0 px-6 py-5" style="background:var(--dark-1)">
			<p class="label-caps" style="color:var(--accent-dark)">Spectator Planner</p>
			<h1 class="mt-1.5 text-xl font-bold tracking-tight" style="color:var(--ti); line-height:1.2">
				Prague Marathon
			</h1>
		</div>

		<!-- Runner inputs — scrollable -->
		<div class="flex-1 overflow-y-auto min-h-0">
			<!-- Section heading lives outside RunnerPanel so padding aligns with dark header -->
			<div class="px-6 pt-5 pb-1">
				<p class="label-caps">Runners</p>
			</div>
			<RunnerPanel sidebar />
		</div>

		<!-- Time slider — pinned to bottom -->
		<div class="shrink-0" style="border-top:1px solid var(--border-s); background:var(--surface)">
			<TimeSlider />
		</div>

	</aside>

	<!-- ── RIGHT CONTENT AREA ──────────────────────────────────────────────── -->
	<div class="flex-1 flex flex-col min-h-0">

		<!-- Map — expands to fill all remaining vertical space -->
		<div class="relative flex-1 min-h-0">
			<Map />
			<!-- Mobile runner overlay (hidden on desktop) -->
			<RunnerPanel />
		</div>

		<!-- Elevation strip — desktop only -->
		<div class="hidden lg:block shrink-0" style="border-top:1px solid var(--border)">
			<!-- Dark label band -->
			<div class="flex items-center px-6 py-2 gap-3" style="background:var(--dark-2)">
				<span class="label-caps" style="color:var(--t3)">Elevation Profile</span>
			</div>
			<!-- Chart area -->
			<div class="h-36" style="background:var(--surface)">
				<ElevationStrip />
			</div>
		</div>

		<!-- Mobile: time slider -->
		<div class="lg:hidden shrink-0" style="border-top:1px solid var(--border); background:var(--surface)">
			<TimeSlider />
		</div>

		<!-- Mobile: checkpoint placeholder -->
		<div
			class="lg:hidden shrink-0 flex items-center px-5 overflow-x-auto"
			style="height:60px; border-top:1px solid var(--border-s); background:var(--surface)"
		>
			<p class="label-caps whitespace-nowrap">Checkpoints coming soon</p>
		</div>

	</div>

</div>
