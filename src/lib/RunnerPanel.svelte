<script lang="ts">
	import { runner1, runner2, type Runner } from './runners.svelte.js';

	let { sidebar = false }: { sidebar?: boolean } = $props();

	type RunnerConfig = { runner: Runner; id: string };

	const configs: RunnerConfig[] = [
		{ runner: runner1, id: 'will'   },
		{ runner: runner2, id: 'maggie' },
	];

	let editingId = $state<string | null>(null);

	function saveRunner(cfg: RunnerConfig) {
		const n = cfg.id === 'will' ? '1' : '2';
		fetch('/api/settings', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				[`runner_${n}_start`]:  cfg.runner.startTime,
				[`runner_${n}_finish`]: cfg.runner.finishTime,
			}),
		}).catch(() => {});
	}
</script>

{#if sidebar}
	<div class="flex flex-col">
		{#each configs as cfg, i}
			<div style="{i > 0 ? 'border-top:1px solid var(--border-s);' : ''}padding:10px 24px">

				<!-- Summary row — always visible -->
				<div style="display:flex;align-items:center;gap:7px">
					<span style="width:8px;height:8px;border-radius:50%;background:{cfg.runner.hexColor};flex-shrink:0"></span>
					<span style="font-size:12px;font-weight:600;color:var(--t1);white-space:nowrap">{cfg.runner.name}</span>
					{#if cfg.runner.raceNumber}
						<span style="font-size:10px;color:var(--t3);white-space:nowrap">({cfg.runner.raceNumber})</span>
					{/if}
					<span style="flex:1"></span>
					{#if editingId !== cfg.id && cfg.runner.finishTime}
						<span style="font-size:11px;font-weight:600;color:var(--t2);font-variant-numeric:tabular-nums;white-space:nowrap">{cfg.runner.finishTime}</span>
					{/if}
					<button
						onclick={() => { editingId = editingId === cfg.id ? null : cfg.id; }}
						style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--accent);background:none;border:none;cursor:pointer;padding:2px 0 2px 10px;flex-shrink:0"
					>{editingId === cfg.id ? 'Done' : 'Edit'}</button>
				</div>

				<!-- Expanded edit fields -->
				{#if editingId === cfg.id}
					<div style="display:flex;gap:12px;margin-top:10px">
						<div style="flex:1;min-width:0">
							<label for="start-{cfg.id}" class="label-caps" style="display:block;margin-bottom:5px">Start</label>
							<input
								id="start-{cfg.id}"
								type="time"
								bind:value={cfg.runner.startTime}
								onblur={() => saveRunner(cfg)}
								class="app-input"
								style="width:100%"
							/>
						</div>
						<div style="flex:1;min-width:0">
							<label for="finish-{cfg.id}" class="label-caps" style="display:block;margin-bottom:5px">
								Finish&thinsp;<span style="text-transform:none;letter-spacing:0;font-weight:400;color:var(--t3);font-size:10px">(H:MM:SS)</span>
							</label>
							<input
								id="finish-{cfg.id}"
								type="text"
								bind:value={cfg.runner.finishTime}
								onblur={() => saveRunner(cfg)}
								pattern="^\d+:[0-5]\d(:[0-5]\d)?$"
								placeholder="3:00:00"
								class="app-input"
								style="width:100%"
							/>
						</div>
					</div>
				{/if}

			</div>
		{/each}
	</div>
{/if}
