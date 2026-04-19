import { runner1, runner2 } from './runners.svelte.js';

class TimeState {
	current = $state(9 * 3600);
}
export const timeState = new TimeState();

/** Earliest start time across valid runners, fallback 09:00 */
export function raceStart(): number {
	const times = [runner1, runner2]
		.filter((r) => r.isValid)
		.map((r) => r.startSeconds);
	return times.length ? Math.min(...times) : 9 * 3600;
}

/** Latest finish time across valid runners, fallback 14:00 */
export function raceEnd(): number {
	const times = [runner1, runner2]
		.filter((r) => r.isValid)
		.map((r) => r.startSeconds + r.finishSeconds);
	return times.length ? Math.max(...times) : 14 * 3600;
}
