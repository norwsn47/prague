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
	hiddenSlots = $state<Record<string, string[]>>({});

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

	isSlotHidden(pointId: string, key: string): boolean {
		return (this.hiddenSlots[pointId] ?? []).includes(key);
	}

	toggleSlot(pointId: string, key: string) {
		const current = this.hiddenSlots[pointId] ?? [];
		const next = current.includes(key)
			? current.filter(k => k !== key)
			: [...current, key];
		this.hiddenSlots = { ...this.hiddenSlots, [pointId]: next };
		this.saveHiddenSlots();
	}

	private saveHiddenSlots() {
		const json = JSON.stringify(this.hiddenSlots);
		try { localStorage.setItem('prague-hidden-slots', json); } catch {}
		fetch('/api/settings', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ hidden_slots: json }),
		}).catch(() => {});
	}

	private loadHiddenSlots() {
		try {
			const raw = localStorage.getItem('prague-hidden-slots');
			if (raw) this.hiddenSlots = JSON.parse(raw);
		} catch {}
	}

	private saveOrder() {
		const json = JSON.stringify(this._order);
		try { localStorage.setItem('prague-spectator-order', json); } catch {}
		fetch('/api/settings', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ spectator_order: json }),
		}).catch(() => {});
	}

	private applyOrder(savedIds: string[], points: SpectatorPoint[]) {
		const existingIds = new Set(points.map(p => p.id));
		const valid = savedIds.filter(id => existingIds.has(id));
		const unsorted = points
			.filter(p => !valid.includes(p.id))
			.sort((a, b) => a.distance_m - b.distance_m)
			.map(p => p.id);
		this._order = [...valid, ...unsorted];
	}

	private loadOrder(points: SpectatorPoint[]) {
		let saved: string[] = [];
		try {
			const raw = localStorage.getItem('prague-spectator-order');
			if (raw) saved = JSON.parse(raw);
		} catch {}
		this.applyOrder(saved, points);
		this.saveOrder();
	}

	async load(): Promise<Record<string, string>> {
		let settings: Record<string, string> = {};
		try {
			const [pointsRes, settingsRes] = await Promise.all([
				fetch('/api/points'),
				fetch('/api/settings'),
			]);

			if (settingsRes.ok) {
				settings = await settingsRes.json();
			}

			if (pointsRes.ok) {
				this.list = await pointsRes.json();
			}

			// Apply ordering — D1 wins over localStorage
			if (settings.spectator_order) {
				try {
					this.applyOrder(JSON.parse(settings.spectator_order), this.list);
					try { localStorage.setItem('prague-spectator-order', settings.spectator_order); } catch {}
				} catch {
					this.loadOrder(this.list);
				}
			} else {
				this.loadOrder(this.list);
			}

			// Apply hidden slots — D1 wins over localStorage
			if (settings.hidden_slots) {
				try {
					this.hiddenSlots = JSON.parse(settings.hidden_slots);
					try { localStorage.setItem('prague-hidden-slots', settings.hidden_slots); } catch {}
				} catch {
					this.loadHiddenSlots();
				}
			} else {
				this.loadHiddenSlots();
			}
		} catch (e) {
			console.error('Failed to load spectator points', e);
			this.loadOrder(this.list);
			this.loadHiddenSlots();
		}
		return settings;
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
				const { [id]: _removed, ...rest } = this.hiddenSlots;
				this.hiddenSlots = rest;
				this.saveHiddenSlots();
				if (this.openPopupId === id) this.openPopupId = null;
			}
		} catch (e) {
			console.error('Failed to delete spectator point', e);
		}
	}
}

export const pointsStore = new PointsStore();
