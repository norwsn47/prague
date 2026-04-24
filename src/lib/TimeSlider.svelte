<script lang="ts">
	import { timeState, raceStart, raceEnd } from './time.svelte.js';
	import { formatTime } from './runners.svelte.js';

	let { compact = false }: { compact?: boolean } = $props();

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

{#if compact}

<!-- ── Compact single-row slider for mobile bottom stack (~44px tall) ─── -->
<div style="
	display:flex; align-items:center; gap:10px;
	padding:10px 16px;
	background:var(--surface);
">
	<!-- Current time -->
	<span style="
		font-size:13px; font-weight:700; font-variant-numeric:tabular-nums;
		color:var(--t1); font-family:var(--font);
		min-width:2.4rem; flex-shrink:0; text-align:right;
	">{formatTime(timeState.current)}</span>

	<!-- Slider -->
	<input
		type="range"
		min={min}
		max={max}
		step={60}
		bind:value={timeState.current}
		class="compact-slider"
		style="
			flex:1; min-width:0;
			height:3px; border-radius:99px;
			background:linear-gradient(to right, var(--accent) {progress}%, #E0E0E0 {progress}%);
			cursor:pointer; appearance:none; -webkit-appearance:none; outline:none;
		"
	/>

	<!-- End time -->
	<span style="
		font-size:10px; font-weight:600;
		color:var(--t3); font-family:var(--font);
		flex-shrink:0;
	">{formatTime(max)}</span>
</div>

{:else}

<!-- ── Full slider for desktop sidebar ──────────────────────────────────── -->
<div class="px-6 py-5 flex flex-col" style="gap:14px">

	<!-- Label + readout -->
	<div class="flex items-end justify-between gap-4">
		<span class="label-caps">Time of day</span>
		<span class="readout">{formatTime(timeState.current)}</span>
	</div>

	<!-- Slider -->
	<div>
		<input
			type="range"
			min={min}
			max={max}
			step={60}
			bind:value={timeState.current}
			class="w-full cursor-pointer appearance-none"
			style="
				height:3px; border-radius:99px;
				background:linear-gradient(to right, var(--accent) {progress}%, #E0E0E0 {progress}%);
				accent-color:var(--accent); outline:none;
			"
		/>
		<div class="flex justify-between mt-2">
			<span style="font-size:11px; color:var(--t3)">{formatTime(min)}</span>
			<span style="font-size:11px; color:var(--t3)">{formatTime(max)}</span>
		</div>
	</div>

</div>

{/if}

<style>
	input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--accent);
		border: 2.5px solid white;
		box-shadow: 0 1px 4px rgba(77,136,152,0.35);
		cursor: pointer;
	}
	input[type="range"]::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--accent);
		border: 2.5px solid white;
		box-shadow: 0 1px 4px rgba(77,136,152,0.35);
		cursor: pointer;
	}
</style>
