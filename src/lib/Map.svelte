<script lang="ts">
	import { mount, unmount } from 'svelte';
	import { onMount, onDestroy } from 'svelte';
	import { ROUTE_COORDS, ROUTE_TOTAL_M, positionAtDistance, findAllSnapCandidates } from './route.js';
	import { runner1, runner2 } from './runners.svelte.js';
	import { timeState } from './time.svelte.js';
	import { pointsStore } from './spectatorPoints.svelte.js';
	import PointPopup from './PointPopup.svelte';

	let mapEl: HTMLDivElement;
	let mapLoaded = $state(false);

	let L: typeof import('leaflet');
	let map: import('leaflet').Map;
	let marker1: import('leaflet').Marker | null = null;
	let marker2: import('leaflet').Marker | null = null;

	const spectatorMarkers = new Map<string, import('leaflet').Marker>();
	const popupInstances = new Map<string, { instance: Record<string, unknown>; container: HTMLDivElement }>();

	function distanceIcon(label: string, variant: 'start-finish' | 'km'): import('leaflet').DivIcon {
		const bg        = variant === 'start-finish' ? '#0f172a' : '#ffffff';
		const textColor = variant === 'start-finish' ? '#f8fafc' : '#374151';
		const border    = variant === 'km' ? '1px solid #e2e8f0' : 'none';
		const shadow    = variant === 'start-finish'
			? '0 2px 8px rgba(15,23,42,0.30),0 1px 2px rgba(15,23,42,0.20)'
			: '0 1px 4px rgba(15,23,42,0.12),0 1px 2px rgba(15,23,42,0.08)';
		return L.divIcon({
			className: '',
			html: `<div style="display:inline-block;background:${bg};color:${textColor};border:${border};border-radius:6px;padding:3px 9px;font-size:11px;font-weight:700;letter-spacing:0.01em;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;white-space:nowrap;box-shadow:${shadow};transform:translate(-50%,-50%)">${label}</div>`,
			iconSize: [0, 0],
			iconAnchor: [0, 0],
		});
	}

	function runnerIcon(initial: string, bg: string): import('leaflet').DivIcon {
		return L.divIcon({
			className: '',
			html: `<div style="width:28px;height:28px;border-radius:50%;background:${bg};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;font-family:sans-serif">${initial}</div>`,
			iconSize: [28, 28],
			iconAnchor: [14, 14],
		});
	}

	// 32×32 hit area — 26px visual circle centred inside
	function spectatorIcon(letter: string): import('leaflet').DivIcon {
		return L.divIcon({
			className: '',
			html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer"><div style="width:26px;height:26px;border-radius:50%;background:#f59e0b;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.30);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif">${letter}</div></div>`,
			iconSize: [32, 32],
			iconAnchor: [16, 16],
		});
	}

	function arrowIcon(bearingDeg: number): import('leaflet').DivIcon {
		return L.divIcon({
			className: '',
			html: `<svg width="14" height="14" viewBox="0 0 12 12" style="display:block;transform:translate(-50%,-50%)"><g transform="rotate(${bearingDeg},6,6)"><polygon points="6,1 11,11 6,7.5 1,11" fill="#3b82f6" fill-opacity="0.85" stroke="white" stroke-width="1.2" stroke-linejoin="round" stroke-opacity="0.65"/></g></svg>`,
			iconSize: [0, 0],
			iconAnchor: [0, 0],
		});
	}

	function computeBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const dLon = (lon2 - lon1) * Math.PI / 180;
		const lat1R = lat1 * Math.PI / 180;
		const lat2R = lat2 * Math.PI / 180;
		const y = Math.sin(dLon) * Math.cos(lat2R);
		const x = Math.cos(lat1R) * Math.sin(lat2R) - Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLon);
		return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
	}

	function positionForRunner(runner: typeof runner1): [number, number] | null {
		if (!runner.isValid) return null;
		const elapsed = timeState.current - runner.startSeconds;
		if (elapsed < 0) return null;
		const distM = Math.min(elapsed / runner.pacePerMetre, 42195);
		const [lon, lat] = positionAtDistance(distM);
		return [lat, lon];
	}

	function syncMarker(
		runner: typeof runner1,
		current: import('leaflet').Marker | null,
		bg: string,
		onUpdate: (m: import('leaflet').Marker | null) => void
	) {
		const pos = positionForRunner(runner);
		if (!pos) { current?.remove(); onUpdate(null); return; }
		if (current) {
			current.setLatLng(pos);
		} else {
			const initial = runner.name.trim()[0]?.toUpperCase() ?? '?';
			const m = L.marker(pos, { icon: runnerIcon(initial, bg), zIndexOffset: 1000 }).addTo(map);
			m.bindTooltip(runner.name, { permanent: false, direction: 'top', offset: [0, -14] });
			onUpdate(m);
		}
	}

	/**
	 * Create a spectator marker and bind a popup whose Svelte content is
	 * (re)mounted fresh in the `popupopen` event — AFTER Leaflet has added
	 * the container to the DOM.  This avoids the previous race where `mount()`
	 * ran on a detached node, and removes the double-handler conflict between
	 * our custom click listener and Leaflet's built-in bindPopup toggle.
	 */
	function addSpectatorMarker(id: string, lat: number, lon: number, letter: string): import('leaflet').Marker {
		const marker = L.marker([lat, lon], {
			icon: spectatorIcon(letter),
			pane: 'spectatorPane',
		}).addTo(map);

		// Stable container — reused across open/close cycles
		const container = document.createElement('div');

		marker.bindPopup(
			L.popup({
				minWidth: 270,
				maxWidth: 310,
				// Keep popup fully visible when near edge of map viewport
				autoPanPaddingTopLeft:     [20, 80] as unknown as import('leaflet').PointExpression,
				autoPanPaddingBottomRight: [20, 20] as unknown as import('leaflet').PointExpression,
				className: 'spectator-popup',
			}).setContent(container)
		);

		// Mount Svelte component AFTER Leaflet puts the container in the DOM
		marker.on('popupopen', () => {
			const prev = popupInstances.get(id);
			if (prev) { unmount(prev.instance); popupInstances.delete(id); }

			const point = pointsStore.list.find(p => p.id === id);
			if (!point) return;

			const instance = mount(PointPopup, {
				target: container,
				props: {
					point,
					letter: pointsStore.letterFor(id),
					onSave:   (name: string, comment: string) => pointsStore.update(id, name, comment),
					onDelete: async () => { marker.closePopup(); await pointsStore.delete(id); },
				},
			}) as Record<string, unknown>;

			popupInstances.set(id, { instance, container });
			if (pointsStore.openPopupId !== id) pointsStore.openPopupId = id;
		});

		marker.on('popupclose', () => {
			if (pointsStore.openPopupId === id) pointsStore.openPopupId = null;
			const inst = popupInstances.get(id);
			if (inst) { unmount(inst.instance); popupInstances.delete(id); }
		});

		spectatorMarkers.set(id, marker);
		return marker;
	}

	function syncSpectatorMarkers() {
		const sorted = pointsStore.sorted;
		const currentIds = new Set(sorted.map(p => p.id));

		for (const [id, marker] of spectatorMarkers) {
			if (!currentIds.has(id)) {
				marker.remove(); // triggers popupclose if open → unmounts Svelte
				const inst = popupInstances.get(id);
				if (inst) { unmount(inst.instance); popupInstances.delete(id); }
				spectatorMarkers.delete(id);
			}
		}

		for (const [i, point] of sorted.entries()) {
			const letter = String.fromCharCode(65 + i);
			if (!spectatorMarkers.has(point.id)) {
				addSpectatorMarker(point.id, point.lat, point.lon, letter);
			} else {
				spectatorMarkers.get(point.id)!.setIcon(spectatorIcon(letter));
			}
		}
	}

	// Runner positions
	$effect(() => {
		if (!mapLoaded) return;
		syncMarker(runner1, marker1, runner1.hexColor, m => { marker1 = m; });
		syncMarker(runner2, marker2, runner2.hexColor, m => { marker2 = m; });
	});

	// Spectator marker add/remove/reletter
	$effect(() => {
		if (!mapLoaded) return;
		void pointsStore.sorted; // tracked dependency
		syncSpectatorMarkers();
	});

	// External trigger: elevation badge or sidebar row clicked
	$effect(() => {
		if (!mapLoaded) return;
		const id = pointsStore.openPopupId;
		if (!id) return;
		const marker = spectatorMarkers.get(id);
		if (!marker || marker.isPopupOpen()) return;
		map.panTo(marker.getLatLng());
		marker.openPopup();
	});

	onMount(async () => {
		L = (await import('leaflet')).default;
		await import('leaflet/dist/leaflet.css');

		map = L.map(mapEl, { zoomControl: true }).setView([50.087591, 14.420676], 13);

		// Spectator pane sits above the route overlay but below runner markers
		const spectatorPaneEl = map.createPane('spectatorPane');
		spectatorPaneEl.style.zIndex = '450';

		L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19,
		}).addTo(map);

		const latLngs = ROUTE_COORDS.map(([lon, lat]) => [lat, lon] as [number, number]);
		L.polyline(latLngs, { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(map);

		const [sfLon, sfLat] = positionAtDistance(0);
		L.marker([sfLat, sfLon], { icon: distanceIcon('Start / Finish', 'start-finish'), zIndexOffset: 500 }).addTo(map);

		for (const km of [10, 20, 30, 40]) {
			const [lon, lat] = positionAtDistance(km * 1000);
			L.marker([lat, lon], { icon: distanceIcon(`${km} km`, 'km'), zIndexOffset: 400 }).addTo(map);
		}

		const ARROW_INTERVAL_M = 1000;
		for (let d = ARROW_INTERVAL_M; d < ROUTE_TOTAL_M - 200; d += ARROW_INTERVAL_M) {
			const [lon1, lat1] = positionAtDistance(d);
			const [lon2, lat2] = positionAtDistance(Math.min(d + 150, ROUTE_TOTAL_M));
			const b = computeBearing(lat1, lon1, lat2, lon2);
			L.marker([lat1, lon1], { icon: arrowIcon(b), zIndexOffset: 300 }).addTo(map);
		}

		map.fitBounds(L.latLngBounds(latLngs), { padding: [20, 20] });

		// Click near route → create spectator point
		map.on('click', async (e: import('leaflet').LeafletMouseEvent) => {
			const candidates = findAllSnapCandidates(e.latlng.lng, e.latlng.lat, 50);
			if (candidates.length === 0) return;

			const nearest = candidates.reduce((a, b) => a.perpDistM < b.perpDistM ? a : b);
			const byDist  = [...candidates].sort((a, b) => a.distanceM - b.distanceM);

			const created = await pointsStore.create({
				name: '',
				comment: '',
				lat: nearest.position[1],
				lon: nearest.position[0],
				distance_m:   byDist[0].distanceM,
				distance_m_2: byDist[1]?.distanceM ?? null,
			});
			if (!created) return;

			// Add marker now (syncSpectatorMarkers effect may not have run yet)
			if (!spectatorMarkers.has(created.id)) {
				addSpectatorMarker(created.id, created.lat, created.lon, pointsStore.letterFor(created.id));
			}
			spectatorMarkers.get(created.id)?.openPopup();
		});

		mapLoaded = true;
		await pointsStore.load();
	});

	onDestroy(() => {
		for (const inst of popupInstances.values()) unmount(inst.instance);
		map?.remove();
	});
</script>

<div bind:this={mapEl} class="w-full h-full"></div>

<style>
	:global(.spectator-popup .leaflet-popup-content) {
		margin: 10px 12px;
	}
</style>
