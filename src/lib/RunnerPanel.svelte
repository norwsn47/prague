<script lang="ts">
	import { runner1, runner2, type Runner } from './runners.svelte.js';

	let { sidebar = false }: { sidebar?: boolean } = $props();

	type RunnerConfig = { runner: Runner; id: string };

	const configs: RunnerConfig[] = [
		{ runner: runner1, id: 'will'   },
		{ runner: runner2, id: 'maggie' },
	];
</script>

{#snippet runnerForm(cfg: RunnerConfig)}
	<div class="flex flex-col" style="gap:12px">

		<!-- Name row + pace chip -->
		<div class="flex items-center gap-2">
			<span class="w-2 h-2 rounded-full shrink-0" style="background:{cfg.runner.hexColor}"></span>
			<span class="text-sm font-semibold" style="color:var(--t1)">{cfg.runner.name}</span>
			{#if cfg.runner.raceNumber}
				<span style="font-size:11px; color:var(--t3)">({cfg.runner.raceNumber})</span>
			{/if}
			{#if cfg.runner.paceString}
				<span class="pace-chip ml-auto">{cfg.runner.paceString}</span>
			{/if}
		</div>

		<!-- Start + Finish on one row -->
		<div class="flex gap-3">
			<div class="flex-1 min-w-0">
				<label for="start-{cfg.id}" class="label-caps block mb-1.5">Start</label>
				<input
					id="start-{cfg.id}"
					type="time"
					bind:value={cfg.runner.startTime}
					class="app-input"
				/>
			</div>
			<div class="flex-1 min-w-0">
				<label for="finish-{cfg.id}" class="label-caps block mb-1.5">
					Finish&thinsp;<span style="text-transform:none;letter-spacing:0;font-weight:400;color:var(--t3);font-size:10px">(H:MM:SS)</span>
				</label>
				<input
					id="finish-{cfg.id}"
					type="text"
					bind:value={cfg.runner.finishTime}
					pattern="^\d+:[0-5]\d(:[0-5]\d)?$"
					placeholder="3:00:00"
					class="app-input"
				/>
			</div>
		</div>

	</div>
{/snippet}

{#if sidebar}
	<div class="flex flex-col">
		{#each configs as cfg, i}
			<div
				class="px-6 py-5"
				style="{i > 0 ? 'border-top:1px solid var(--border-s)' : ''}"
			>
				{@render runnerForm(cfg)}
			</div>
		{/each}
	</div>
{/if}
