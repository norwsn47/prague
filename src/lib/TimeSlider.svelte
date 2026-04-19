<script lang="ts">
	import { timeState, raceStart, raceEnd } from './time.svelte.js';
	import { formatTime } from './runners.svelte.js';

	const min = $derived(raceStart());
	const max = $derived(raceEnd());

	// Clamp current time when range changes
	$effect(() => {
		const lo = min;
		const hi = max;
		if (timeState.current < lo) timeState.current = lo;
		if (timeState.current > hi) timeState.current = hi;
	});

	const progress = $derived(
		max > min ? ((timeState.current - min) / (max - min)) * 100 : 0
	);
</script>

<div class="flex flex-col gap-3 p-4">
	<div class="flex items-baseline justify-between">
		<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Race time</span>
		<span class="text-2xl font-bold tabular-nums text-gray-800">{formatTime(timeState.current)}</span>
	</div>

	<!-- Slider -->
	<div class="relative">
		<input
			type="range"
			min={min}
			max={max}
			step={60}
			bind:value={timeState.current}
			class="w-full h-2 rounded-full appearance-none cursor-pointer
				   bg-gray-200 accent-blue-500"
			style="background: linear-gradient(to right, #3b82f6 {progress}%, #e5e7eb {progress}%)"
		/>
		<div class="flex justify-between mt-1">
			<span class="text-xs text-gray-400 tabular-nums">{formatTime(min)}</span>
			<span class="text-xs text-gray-400 tabular-nums">{formatTime(max)}</span>
		</div>
	</div>

</div>
