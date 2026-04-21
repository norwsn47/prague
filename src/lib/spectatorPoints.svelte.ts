export type SpectatorPoint = {
	id: string;
	name: string;
	comment: string;
	lat: number;
	lon: number;
	distance_m: number;
};

class PointsStore {
	list = $state<SpectatorPoint[]>([]);
	openPopupId = $state<string | null>(null);

	get sorted(): SpectatorPoint[] {
		return [...this.list].sort((a, b) => a.distance_m - b.distance_m);
	}

	letterFor(id: string): string {
		const idx = this.sorted.findIndex((p) => p.id === id);
		return idx === -1 ? '?' : String.fromCharCode(65 + idx);
	}

	async load() {
		try {
			const res = await fetch('/api/points');
			if (res.ok) this.list = await res.json();
		} catch (e) {
			console.error('Failed to load spectator points', e);
		}
	}

	async create(data: Omit<SpectatorPoint, 'id'>): Promise<SpectatorPoint | null> {
		try {
			const res = await fetch('/api/points', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			if (!res.ok) return null;
			const created: SpectatorPoint = await res.json();
			this.list.push(created);
			return created;
		} catch (e) {
			console.error('Failed to create spectator point', e);
			return null;
		}
	}

	async update(id: string, name: string, comment: string) {
		try {
			const res = await fetch(`/api/points/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, comment }),
			});
			if (res.ok) {
				const p = this.list.find((p) => p.id === id);
				if (p) {
					p.name = name;
					p.comment = comment;
				}
			}
		} catch (e) {
			console.error('Failed to update spectator point', e);
		}
	}

	async delete(id: string) {
		try {
			const res = await fetch(`/api/points/${id}`, { method: 'DELETE' });
			if (res.ok) {
				this.list = this.list.filter((p) => p.id !== id);
				if (this.openPopupId === id) this.openPopupId = null;
			}
		} catch (e) {
			console.error('Failed to delete spectator point', e);
		}
	}
}

export const pointsStore = new PointsStore();
