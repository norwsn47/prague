export class Runner {
	name = $state('');
	startTime = $state('09:00');
	finishTime = $state('4:00:00');

	/** Parse finishTime string (H:MM or H:MM:SS) into total seconds */
	get finishSeconds(): number {
		return parseDuration(this.finishTime);
	}

	/** Parse startTime string (HH:MM) into seconds since midnight */
	get startSeconds(): number {
		const [h, m] = this.startTime.split(':').map(Number);
		return (h || 0) * 3600 + (m || 0) * 60;
	}

	/** Pace in seconds per metre */
	get pacePerMetre(): number {
		const secs = this.finishSeconds;
		return secs > 0 ? secs / 42195 : 0;
	}

	get isValid(): boolean {
		return this.name.trim().length > 0 && this.finishSeconds > 0;
	}
}

export const runner1 = new Runner();
export const runner2 = new Runner();

/** Parse "H:MM", "H:MM:SS" into seconds */
export function parseDuration(s: string): number {
	const parts = s.split(':').map(Number);
	if (parts.some(isNaN)) return 0;
	if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60;
	if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
	return 0;
}

/** Format seconds-since-midnight as "HH:MM" */
export function formatTime(secs: number): string {
	const h = Math.floor(secs / 3600) % 24;
	const m = Math.floor((secs % 3600) / 60);
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
