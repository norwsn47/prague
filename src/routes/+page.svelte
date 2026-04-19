<script lang="ts">
	import Map from '$lib/Map.svelte';
	import RunnerPanel from '$lib/RunnerPanel.svelte';
</script>

<div class="h-dvh flex flex-col overflow-hidden">
	<!-- Map area — takes all remaining space, runner panel overlays it -->
	<div class="relative flex-1 min-h-0">
		<Map />
		<RunnerPanel />
	</div>

	<!-- Checkpoint cards — bottom strip (placeholder) -->
	<div class="h-36 shrink-0 bg-gray-50 border-t border-gray-200 flex items-center px-3 gap-2 overflow-x-auto">
		<p class="text-sm text-gray-400 whitespace-nowrap">Checkpoint cards will appear here</p>
	</div>
</div>
