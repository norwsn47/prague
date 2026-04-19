<script lang="ts">
	import { timeState, raceStart, raceEnd } from './time.svelte.js';
	import { formatTime } from './runners.svelte.js';

	const min = $derived(raceStart());
	const max = $derived(raceEnd());

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

<div class="px-6 py-5 flex flex-col" style="gap:14px">

	<!-- Label + time readout -->
	<div class="flex items-end justify-between gap-4">
		<span class="label-caps">Race Time</span>
		<span class="readout">{formatTime(timeState.current)}</span>
	</div>

	<!-- Range slider -->
	<div>
		<input
			type="range"
			min={min}
			max={max}
			step={60}
			bind:value={timeState.current}
			class="w-full cursor-pointer appearance-none"
			style="
				height: 3px;
				border-radius: 99px;
				background: linear-gradient(to right, var(--accent) {progress}%, #e2e8f0 {progress}%);
				accent-color: var(--accent);
				outline: none;
			"
		/>
		<div class="flex justify-between mt-2">
			<span class="label-caps" style="text-transform:none;letter-spacing:0;font-size:11px;color:var(--t3)">
				{formatTime(min)}
			</span>
			<span class="label-caps" style="text-transform:none;letter-spacing:0;font-size:11px;color:var(--t3)">
				{formatTime(max)}
			</span>
		</div>
	</div>

</div>

<style>
	/* Thumb styling — cross-browser */
	input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--accent);
		border: 2.5px solid white;
		box-shadow: 0 1px 4px rgba(79,70,229,0.35);
		cursor: pointer;
	}
	input[type="range"]::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--accent);
		border: 2.5px solid white;
		box-shadow: 0 1px 4px rgba(79,70,229,0.35);
		cursor: pointer;
	}
</style>
