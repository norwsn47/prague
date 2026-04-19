<script lang="ts">
	import Map from '$lib/Map.svelte';
	import RunnerPanel from '$lib/RunnerPanel.svelte';
	import TimeSlider from '$lib/TimeSlider.svelte';
	import ElevationStrip from '$lib/ElevationStrip.svelte';
</script>

<div class="h-dvh flex flex-col lg:flex-row overflow-hidden">

	<!-- LEFT sidebar — desktop only -->
	<aside class="hidden lg:flex lg:flex-col w-80 xl:w-96 shrink-0 border-r border-gray-200 bg-white">

		<div class="px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
			<h1 class="text-base font-bold text-gray-800">Prague Marathon</h1>
			<p class="text-xs text-gray-400 mt-0.5">Spectator planner</p>
		</div>

		<!-- Runner inputs fill remaining sidebar space, scroll if needed -->
		<div class="flex-1 overflow-y-auto min-h-0">
			<RunnerPanel sidebar />
		</div>

		<!-- Time slider pinned to bottom of sidebar -->
		<div class="shrink-0 border-t border-gray-100">
			<TimeSlider />
		</div>

	</aside>

	<!-- RIGHT content area — map stacked above elevation strip -->
	<div class="flex-1 flex flex-col min-h-0">

		<!-- Map — takes all available vertical space -->
		<div class="relative flex-1 min-h-0">
			<Map />
			<!-- Mobile runner overlay (hidden on desktop) -->
			<RunnerPanel />
		</div>

		<!-- Elevation strip — desktop only, fixed height below map -->
		<div class="hidden lg:block shrink-0 h-40 border-t border-gray-200">
			<ElevationStrip />
		</div>

		<!-- Mobile: time slider above bottom cards -->
		<div class="lg:hidden shrink-0 border-t border-gray-200 bg-white">
			<TimeSlider />
		</div>

		<!-- Mobile: checkpoint cards placeholder -->
		<div class="lg:hidden shrink-0 h-28 bg-gray-50 border-t border-gray-200 flex items-center px-3 overflow-x-auto">
			<p class="text-sm text-gray-400 whitespace-nowrap">Checkpoint cards will appear here</p>
		</div>

	</div>

</div>
