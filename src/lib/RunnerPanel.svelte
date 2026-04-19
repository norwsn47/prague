<script lang="ts">
	import { runner1, runner2, type Runner } from './runners.svelte.js';

	let open = $state(true);

	type RunnerConfig = { runner: Runner; label: string; color: string; border: string; bg: string; text: string };

	const configs: RunnerConfig[] = [
		{
			runner: runner1,
			label: 'Runner 1',
			color: 'green',
			border: 'border-green-500',
			bg: 'bg-green-500',
			text: 'text-green-700',
		},
		{
			runner: runner2,
			label: 'Runner 2',
			color: 'pink',
			border: 'border-pink-500',
			bg: 'bg-pink-500',
			text: 'text-pink-700',
		},
	];
</script>

<div class="absolute top-2 left-2 right-2 z-[1000] pointer-events-none">
	<div class="pointer-events-auto mx-auto max-w-xl">
		<!-- Header bar -->
		<div class="flex items-center justify-between rounded-t-xl bg-white/90 backdrop-blur px-3 py-2 shadow-lg border border-white/60">
			<span class="text-sm font-semibold text-gray-700">Runners</span>
			<button
				onclick={() => (open = !open)}
				class="text-gray-500 hover:text-gray-800 transition-colors p-1 -mr-1"
				aria-label={open ? 'Collapse' : 'Expand'}
			>
				<svg class="w-4 h-4 transition-transform {open ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
		</div>

		<!-- Inputs -->
		{#if open}
			<div class="grid grid-cols-2 gap-px bg-gray-200 rounded-b-xl overflow-hidden shadow-lg border border-t-0 border-white/60">
				{#each configs as { runner, label, border, bg, text }}
					<div class="bg-white/90 backdrop-blur p-3 flex flex-col gap-2">
						<!-- Colour pip + label -->
						<div class="flex items-center gap-1.5">
							<span class="w-2.5 h-2.5 rounded-full {bg} shrink-0"></span>
							<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
						</div>

						<!-- Name -->
						<input
							type="text"
							placeholder="Name"
							bind:value={runner.name}
							class="w-full rounded-lg border {border} px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-gray-300"
						/>

						<!-- Start time -->
						<div>
							<label class="block text-xs {text} font-medium mb-0.5">Start time</label>
							<input
								type="time"
								bind:value={runner.startTime}
								class="w-full rounded-lg border {border} px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2"
							/>
						</div>

						<!-- Finish time -->
						<div>
							<label class="block text-xs {text} font-medium mb-0.5">Finish time <span class="font-normal text-gray-400">(H:MM:SS)</span></label>
							<input
								type="text"
								placeholder="4:00:00"
								bind:value={runner.finishTime}
								pattern="^\d+:[0-5]\d(:[0-5]\d)?$"
								class="w-full rounded-lg border {border} px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 placeholder:text-gray-300"
							/>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
