import { runner1, runner2, formatTime, MARATHON_DIST_M } from './runners.svelte.js';
import type { SpectatorPoint } from './spectatorPoints.svelte.js';
import { unitStore } from './units.svelte.js';

export type ArrivalRow = {
	key: string;
	name: string;
	color: string;
	distM: number;
	arrivalSecs: number;
	arrivalStr: string;
};

/**
 * Builds arrival-time rows for a spectator point, one per valid runner × distance.
 * Sorted by ascending arrival time. Safe to call inside $derived — reads reactive
 * runner state (startSeconds, pacePerMetre, isValid) through Svelte's tracking.
 */
export function buildArrivalRows(point: SpectatorPoint): ArrivalRow[] {
	const distances = point.distance_m_2 != null
		? [point.distance_m, point.distance_m_2 as number]
		: [point.distance_m];

	const rows: ArrivalRow[] = [];
	for (const [di, distM] of distances.entries()) {
		for (const [ri, r] of [runner1, runner2].entries()) {
			if (!r.isValid) continue;
			const arrivalSecs = r.startSeconds + distM * r.pacePerMetre;
			rows.push({
				key: `${di}-${ri}`,
				name: r.name,
				color: r.hexColor,
				distM,
				arrivalSecs: distM >= MARATHON_DIST_M ? Infinity : arrivalSecs,
				arrivalStr:  distM >= MARATHON_DIST_M ? 'finished' : formatTime(arrivalSecs),
			});
		}
	}
	return rows.sort((a, b) => a.arrivalSecs - b.arrivalSecs);
}

export function kmLabel(distM: number): string {
	return unitStore.format(distM);
}
