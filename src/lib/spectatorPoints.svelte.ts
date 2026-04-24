export type SpectatorPoint = {
	id: string;
	name: string;
	comment: string;
	lat: number;
	lon: number;
	distance_m: number;
	distance_m_2?: number | null;
};

class PointsStore {
	list = $state<SpectatorPoint[]>([]);
	openPopupId = $state<string | null>(null);
	private _order = $state<string[]>([]);

	get sorted(): SpectatorPoint[] {
		const ordered = this._order
			.map(id => this.list.find(p => p.id === id))
			.filter(Boolean) as SpectatorPoint[];
		const unordered = this.list
			.filter(p => !this._order.includes(p.id))
			.sort((a, b) => a.distance_m - b.distance_m);
		return [...ordered, ...unordered];
	}

	letterFor(id: string): string {
		const idx = this.sorted.findIndex(p => p.id === id);
		return idx === -1 ? '?' : String.fromCharCode(65 + idx);
	}

	moveUp(id: string) {
		const order = [...this._order];
		const idx = order.indexOf(id);
		if (idx <= 0) return;
		[order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
		this._order = order;
		this.saveOrder();
	}

	moveDown(id: string) {
		const order = [...this._order];
		const idx = order.indexOf(id);
		if (idx === -1 || idx >= order.length - 1) return;
		[order[idx], order[idx + 1]] = [order[idx + 1], order[idx]];
		this._order = order;
		this.saveOrder();
	}

	private saveOrder() {
		try { localStorage.setItem('prague-spectator-order', JSON.stringify(this._order)); } catch {}
	}

	private loadOrder(points: SpectatorPoint[]) {
		let saved: string[] = [];
		try {
			const raw = localStorage.getItem('prague-spectator-order');
			if (raw) saved = JSON.parse(raw);
		} catch {}
		const existingIds = new Set(points.map(p => p.id));
		const validSaved = saved.filter(id => existingIds.has(id));
		const unsaved = points
			.filter(p => !validSaved.includes(p.id))
			.sort((a, b) => a.distance_m - b.distance_m)
			.map(p => p.id);
		this._order = [...validSaved, ...unsaved];
		this.saveOrder();
	}

	async load() {
		try {
			const res = await fetch('/api/points');
			if (res.ok) {
				this.list = await res.json();
				this.loadOrder(this.list);
			}
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
			this._order = [...this._order, created.id];
			this.saveOrder();
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
				this._order = this._order.filter(oid => oid !== id);
				this.saveOrder();
				if (this.openPopupId === id) this.openPopupId = null;
			}
		} catch (e) {
			console.error('Failed to delete spectator point', e);
		}
	}
}

export const pointsStore = new PointsStore();
