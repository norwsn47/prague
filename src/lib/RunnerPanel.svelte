<script lang="ts">
	import { runner1, runner2, type Runner } from './runners.svelte.js';

	let { sidebar = false }: { sidebar?: boolean } = $props();
	let open = $state(true);

	type RunnerConfig = {
		runner: Runner;
		color: string;
		border: string;
		bg: string;
		text: string;
		ring: string;
	};

	// Will: dark green (green-700/800). Maggie: pink.
	const configs: RunnerConfig[] = [
		{
			runner: runner1,
			color: 'will',
			border: 'border-green-700',
			bg: 'bg-green-700',
			text: 'text-green-800',
			ring: 'focus:ring-green-300',
		},
		{
			runner: runner2,
			color: 'maggie',
			border: 'border-pink-500',
			bg: 'bg-pink-500',
			text: 'text-pink-700',
			ring: 'focus:ring-pink-300',
		},
	];
</script>

{#snippet runnerForm(cfg: RunnerConfig)}
	<div class="flex flex-col gap-2">
		<!-- Runner name heading with colour pip -->
		<div class="flex items-center gap-1.5">
			<span class="w-2.5 h-2.5 rounded-full {cfg.bg} shrink-0"></span>
			<span class="text-sm font-semibold text-gray-700">{cfg.runner.name}</span>
		</div>

		<!-- Start time -->
		<div>
			<label for="start-{cfg.color}" class="block text-xs {cfg.text} font-medium mb-0.5">Start time</label>
			<input
				id="start-{cfg.color}"
				type="time"
				bind:value={cfg.runner.startTime}
				class="w-full rounded-lg border {cfg.border} px-2.5 py-1.5 text-sm focus:outline-none {cfg.ring} focus:ring-2"
			/>
		</div>

		<!-- Finish duration + live pace -->
		<div>
			<label for="finish-{cfg.color}" class="block text-xs {cfg.text} font-medium mb-0.5">
				Predicted finish <span class="font-normal text-gray-400">(H:MM:SS)</span>
			</label>
			<input
				id="finish-{cfg.color}"
				type="text"
				bind:value={cfg.runner.finishTime}
				pattern="^\d+:[0-5]\d(:[0-5]\d)?$"
				class="w-full rounded-lg border {cfg.border} px-2.5 py-1.5 text-sm font-mono focus:outline-none {cfg.ring} focus:ring-2 placeholder:text-gray-300"
			/>
			{#if cfg.runner.paceString}
				<p class="text-xs text-gray-400 mt-1 font-mono">{cfg.runner.paceString}</p>
			{/if}
		</div>
	</div>
{/snippet}

{#if sidebar}
	<!-- Desktop sidebar: static, full-width sections -->
	<div class="p-4 flex flex-col gap-5">
		{#each configs as cfg}
			{@render runnerForm(cfg)}
		{/each}
	</div>
{:else}
	<!-- Mobile overlay: floating glass card, hidden on desktop -->
	<div class="absolute top-2 left-2 right-2 z-[1000] pointer-events-none lg:hidden">
		<div class="pointer-events-auto mx-auto max-w-xl">
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
			{#if open}
				<div class="grid grid-cols-2 gap-px bg-gray-200 rounded-b-xl overflow-hidden shadow-lg border border-t-0 border-white/60">
					{#each configs as cfg}
						<div class="bg-white/90 backdrop-blur p-3">
							{@render runnerForm(cfg)}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
