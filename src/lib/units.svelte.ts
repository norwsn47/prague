export type Unit = 'mi' | 'km';

class UnitStore {
	current = $state<Unit>('mi');

	/** Format a distance in metres for display, e.g. "6.2 mi" or "10 km" */
	format(distM: number, decimals = 1): string {
		if (this.current === 'mi') {
			return `${(distM / 1609.344).toFixed(decimals)} mi`;
		}
		const km = distM / 1000;
		// Drop trailing zero: 4.0 → "4", 6.6 stays "6.6"
		return `${parseFloat(km.toFixed(decimals))} km`;
	}

	/** Label for map distance markers (km stays integer) */
	mapLabel(distM: number): string {
		if (this.current === 'mi') {
			return `${(distM / 1609.344).toFixed(1)} mi`;
		}
		return `${Math.round(distM / 1000)} km`;
	}

	/** Pace string from seconds-per-km */
	paceLabel(secsPerKm: number): string {
		const secs = this.current === 'mi' ? secsPerKm * 1.60934 : secsPerKm;
		const mins = Math.floor(secs / 60);
		const s = Math.round(secs % 60);
		return `${mins}:${String(s).padStart(2, '0')} /${this.current}`;
	}
}

export const unitStore = new UnitStore();
