<script lang="ts">
	import { runner1, runner2, type Runner } from './runners.svelte.js';

	let { sidebar = false }: { sidebar?: boolean } = $props();
	let open = $state(true);

	type RunnerConfig = {
		runner: Runner;
		id: string;
	};

	const configs: RunnerConfig[] = [
		{ runner: runner1, id: 'will'   },
		{ runner: runner2, id: 'maggie' },
	];
</script>

{#snippet runnerForm(cfg: RunnerConfig, compact = false)}
	<div class="flex flex-col" style="gap:{compact ? '8px' : '12px'}">

		<!-- Runner name row + pace chip -->
		<div class="flex items-center gap-2">
			<span
				class="w-2 h-2 rounded-full shrink-0"
				style="background:{cfg.runner.hexColor}"
			></span>
			<span class="text-sm font-semibold" style="color:var(--t1)">{cfg.runner.name}</span>
			{#if cfg.runner.paceString}
				<span class="pace-chip ml-auto">{cfg.runner.paceString}</span>
			{/if}
		</div>

		<!-- Start time -->
		<div>
			<label for="start-{cfg.id}" class="label-caps block mb-1.5">Start time</label>
			<input
				id="start-{cfg.id}"
				type="time"
				bind:value={cfg.runner.startTime}
				class="app-input"
			/>
		</div>

		<!-- Predicted finish -->
		<div>
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
{/snippet}

{#if sidebar}
	<!-- ── Desktop sidebar: two runner sections divided by a hairline ───────── -->
	<div class="flex flex-col" style="divide-y:1px solid var(--border-s)">
		{#each configs as cfg, i}
			<div
				class="px-6 py-5"
				style="{i > 0 ? 'border-top:1px solid var(--border-s)' : ''}"
			>
				{@render runnerForm(cfg, false)}
			</div>
		{/each}
	</div>

{:else}
	<!-- ── Mobile overlay: floating glass card ──────────────────────────────── -->
	<div class="absolute top-2 left-2 right-2 z-[1000] pointer-events-none lg:hidden">
		<div class="pointer-events-auto mx-auto max-w-sm">

			<!-- Card header -->
			<div
				class="flex items-center justify-between px-4 py-3"
				style="
					background:rgba(255,255,255,0.96);
					backdrop-filter:blur(12px);
					-webkit-backdrop-filter:blur(12px);
					border-radius:var(--r-lg) var(--r-lg) {open ? '0 0' : 'var(--r-lg) var(--r-lg)'};
					box-shadow:var(--shadow-md);
					border:1px solid rgba(255,255,255,0.7);
				"
			>
				<span class="label-caps">Runners</span>
				<button
					onclick={() => (open = !open)}
					class="p-1 -mr-1 transition-colors"
					style="color:var(--t3)"
					aria-label={open ? 'Collapse' : 'Expand'}
				>
					<svg
						class="w-4 h-4 transition-transform"
						style="transform:rotate({open ? 180 : 0}deg)"
						fill="none" stroke="currentColor" viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>
			</div>

			<!-- Runner forms -->
			{#if open}
				<div
					class="grid grid-cols-2"
					style="
						background:rgba(255,255,255,0.96);
						backdrop-filter:blur(12px);
						-webkit-backdrop-filter:blur(12px);
						border-radius:0 0 var(--r-lg) var(--r-lg);
						box-shadow:var(--shadow-md);
						border:1px solid rgba(255,255,255,0.7);
						border-top:1px solid var(--border-s);
					"
				>
					{#each configs as cfg, i}
						<div
							class="p-4"
							style="{i > 0 ? 'border-left:1px solid var(--border-s)' : ''}"
						>
							{@render runnerForm(cfg, true)}
						</div>
					{/each}
				</div>
			{/if}

		</div>
	</div>
{/if}
