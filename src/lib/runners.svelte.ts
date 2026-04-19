export class Runner {
	readonly name: string;
	readonly hexColor: string;
	readonly raceNumber: string;
	startTime = $state('11:00');
	finishTime = $state('3:00:00');

	constructor(name: string, hexColor: string, defaultFinish: string, raceNumber = '') {
		this.name = name;
		this.hexColor = hexColor;
		this.raceNumber = raceNumber;
		this.finishTime = defaultFinish;
	}

	get finishSeconds(): number {
		return parseDuration(this.finishTime);
	}

	get startSeconds(): number {
		const [h, m] = this.startTime.split(':').map(Number);
		return (h || 0) * 3600 + (m || 0) * 60;
	}

	/** Seconds per metre at target pace */
	get pacePerMetre(): number {
		const secs = this.finishSeconds;
		return secs > 0 ? secs / 42195 : 0;
	}

	/** Human-readable pace string, e.g. "4:16 /km" */
	get paceString(): string {
		const secs = this.finishSeconds;
		if (secs <= 0) return '';
		const secsPerKm = secs / 42.195;
		const mins = Math.floor(secsPerKm / 60);
		const sec = Math.round(secsPerKm % 60);
		return `${mins}:${String(sec).padStart(2, '0')} /km`;
	}

	get isValid(): boolean {
		return this.finishSeconds > 0;
	}
}

// Will — dark green; Maggie — pink
export const runner1 = new Runner('Will',   '#15803d', '3:00:00', '1125');
export const runner2 = new Runner('Maggie', '#ec4899', '4:55:00', 'F1645');

/** Parse "H:MM" or "H:MM:SS" into total seconds */
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
