<script lang="ts">
	import { mount, unmount } from 'svelte';
	import { onMount, onDestroy } from 'svelte';
	import { ROUTE_COORDS, ROUTE_TOTAL_M, positionAtDistance, findAllSnapCandidates } from './route.js';
	import { runner1, runner2 } from './runners.svelte.js';
	import { timeState } from './time.svelte.js';
	import { pointsStore, type SpectatorPoint } from './spectatorPoints.svelte.js';
	import PointPopup from './PointPopup.svelte';

	let mapEl: HTMLDivElement;
	let mapLoaded = $state(false);

	let L: typeof import('leaflet');
	let map: import('leaflet').Map;
	let marker1: import('leaflet').Marker | null = null;
	let marker2: import('leaflet').Marker | null = null;

	// Spectator point tracking — id → Leaflet marker
	const spectatorMarkers = new Map<string, import('leaflet').Marker>();
	// Mounted Svelte popup instances — id → { instance, container }
	const popupInstances = new Map<string, { instance: Record<string, unknown>; container: HTMLDivElement }>();

	// 'start-finish' = dark navy pill; 'km' = white pill with subtle border
	function distanceIcon(label: string, variant: 'start-finish' | 'km'): import('leaflet').DivIcon {
		const bg          = variant === 'start-finish' ? '#0f172a' : '#ffffff';
		const textColor   = variant === 'start-finish' ? '#f8fafc' : '#374151';
		const border      = variant === 'km' ? '1px solid #e2e8f0' : 'none';
		const shadow      = variant === 'start-finish'
			? '0 2px 8px rgba(15,23,42,0.30),0 1px 2px rgba(15,23,42,0.20)'
			: '0 1px 4px rgba(15,23,42,0.12),0 1px 2px rgba(15,23,42,0.08)';
		return L.divIcon({
			className: '',
			html: `<div style="
				display:inline-block;
				background:${bg};color:${textColor};border:${border};
				border-radius:6px;padding:3px 9px;
				font-size:11px;font-weight:700;letter-spacing:0.01em;
				font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;
				white-space:nowrap;
				box-shadow:${shadow};
				transform:translate(-50%,-50%);
			">${label}</div>`,
			iconSize: [0, 0],
			iconAnchor: [0, 0],
		});
	}

	function runnerIcon(initial: string, bg: string): import('leaflet').DivIcon {
		return L.divIcon({
			className: '',
			html: `<div style="
				width:28px;height:28px;border-radius:50%;
				background:${bg};border:3px solid white;
				box-shadow:0 2px 6px rgba(0,0,0,0.35);
				display:flex;align-items:center;justify-content:center;
				color:white;font-weight:700;font-size:12px;font-family:sans-serif;
			">${initial}</div>`,
			iconSize: [28, 28],
			iconAnchor: [14, 14],
		});
	}

	function spectatorIcon(letter: string): import('leaflet').DivIcon {
		return L.divIcon({
			className: '',
			html: `<div style="
				width:24px;height:24px;border-radius:50%;
				background:#f59e0b;border:2.5px solid white;
				box-shadow:0 2px 6px rgba(0,0,0,0.30);
				display:flex;align-items:center;justify-content:center;
				color:white;font-weight:700;font-size:11px;
				font-family:-apple-system,BlinkMacSystemFont,sans-serif;
				transform:translate(-50%,-50%);
			">${letter}</div>`,
			iconSize: [0, 0],
			iconAnchor: [0, 0],
		});
	}

	function arrowIcon(bearingDeg: number): import('leaflet').DivIcon {
		return L.divIcon({
			className: '',
			html: `<svg width="14" height="14" viewBox="0 0 12 12"
				style="display:block;transform:translate(-50%,-50%)">
				<g transform="rotate(${bearingDeg},6,6)">
					<polygon points="6,1 11,11 6,7.5 1,11"
						fill="#3b82f6" fill-opacity="0.85"
						stroke="white" stroke-width="1.2" stroke-linejoin="round" stroke-opacity="0.65"/>
				</g>
			</svg>`,
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
		if (!pos) {
			current?.remove();
			onUpdate(null);
			return;
		}
		if (current) {
			current.setLatLng(pos);
		} else {
			const initial = runner.name.trim()[0]?.toUpperCase() ?? '?';
			const m = L.marker(pos, { icon: runnerIcon(initial, bg), zIndexOffset: 1000 }).addTo(map);
			m.bindTooltip(runner.name, { permanent: false, direction: 'top', offset: [0, -14] });
			onUpdate(m);
		}
	}

	function openPointPopup(point: SpectatorPoint) {
		const marker = spectatorMarkers.get(point.id);
		if (!marker) return;

		// Unmount any existing popup for this point
		const prev = popupInstances.get(point.id);
		if (prev) {
			unmount(prev.instance);
			popupInstances.delete(point.id);
		}

		const letter = pointsStore.letterFor(point.id);
		const container = document.createElement('div');
		const instance = mount(PointPopup, {
			target: container,
			props: {
				point,
				letter,
				onSave: (name: string, comment: string) => pointsStore.update(point.id, name, comment),
				onDelete: () => pointsStore.delete(point.id),
			},
		}) as Record<string, unknown>;
		popupInstances.set(point.id, { instance, container });

		marker.bindPopup(
			L.popup({ minWidth: 254, maxWidth: 280, className: 'spectator-popup' }).setContent(container)
		);
		marker.openPopup();

		if (pointsStore.openPopupId !== point.id) {
			pointsStore.openPopupId = point.id;
		}
	}

	function addSpectatorMarker(id: string, lat: number, lon: number, letter: string) {
		const marker = L.marker([lat, lon], {
			icon: spectatorIcon(letter),
			zIndexOffset: 900,
		}).addTo(map);

		marker.on('click', () => {
			const point = pointsStore.list.find((p) => p.id === id);
			if (point) openPointPopup(point);
		});

		marker.on('popupclose', () => {
			if (pointsStore.openPopupId === id) pointsStore.openPopupId = null;
			const inst = popupInstances.get(id);
			if (inst) {
				unmount(inst.instance);
				popupInstances.delete(id);
			}
		});

		spectatorMarkers.set(id, marker);
		return marker;
	}

	function syncSpectatorMarkers() {
		const sorted = pointsStore.sorted;
		const currentIds = new Set(sorted.map((p) => p.id));

		// Remove deleted markers
		for (const [id, marker] of spectatorMarkers) {
			if (!currentIds.has(id)) {
				marker.closePopup();
				marker.remove();
				spectatorMarkers.delete(id);
				const inst = popupInstances.get(id);
				if (inst) { unmount(inst.instance); popupInstances.delete(id); }
			}
		}

		// Add new markers; update icon (letter) for existing ones
		for (const [i, point] of sorted.entries()) {
			const letter = String.fromCharCode(65 + i);
			if (!spectatorMarkers.has(point.id)) {
				addSpectatorMarker(point.id, point.lat, point.lon, letter);
			} else {
				spectatorMarkers.get(point.id)!.setIcon(spectatorIcon(letter));
			}
		}
	}

	// Sync runner markers to timeState
	$effect(() => {
		if (!mapLoaded) return;
		syncMarker(runner1, marker1, runner1.hexColor, (m) => { marker1 = m; });
		syncMarker(runner2, marker2, runner2.hexColor, (m) => { marker2 = m; });
	});

	// Sync spectator markers when list changes
	$effect(() => {
		if (!mapLoaded) return;
		void pointsStore.sorted; // establish reactivity
		syncSpectatorMarkers();
	});

	// Open popup when openPopupId is set externally (e.g. from elevation strip)
	$effect(() => {
		if (!mapLoaded) return;
		const id = pointsStore.openPopupId;
		if (!id) return;
		const marker = spectatorMarkers.get(id);
		if (marker && !marker.isPopupOpen()) {
			const point = pointsStore.list.find((p) => p.id === id);
			if (point) {
				map.panTo(marker.getLatLng());
				openPointPopup(point);
			}
		}
	});

	onMount(async () => {
		L = (await import('leaflet')).default;
		await import('leaflet/dist/leaflet.css');

		map = L.map(mapEl, { zoomControl: true }).setView([50.087591, 14.420676], 13);

		L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19,
		}).addTo(map);

		const latLngs = ROUTE_COORDS.map(([lon, lat]) => [lat, lon] as [number, number]);
		L.polyline(latLngs, { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(map);

		// Single Start / Finish marker (marathon is a loop — same location)
		const [sfLon, sfLat] = positionAtDistance(0);
		L.marker([sfLat, sfLon], {
			icon: distanceIcon('Start / Finish', 'start-finish'),
			zIndexOffset: 500,
		}).addTo(map);

		// 10 km interval markers
		for (const km of [10, 20, 30, 40]) {
			const [lon, lat] = positionAtDistance(km * 1000);
			L.marker([lat, lon], {
				icon: distanceIcon(`${km} km`, 'km'),
				zIndexOffset: 400,
			}).addTo(map);
		}

		// Direction arrows every 1 km
		const ARROW_INTERVAL_M = 1000;
		for (let d = ARROW_INTERVAL_M; d < ROUTE_TOTAL_M - 200; d += ARROW_INTERVAL_M) {
			const [lon1, lat1] = positionAtDistance(d);
			const [lon2, lat2] = positionAtDistance(Math.min(d + 150, ROUTE_TOTAL_M));
			const b = computeBearing(lat1, lon1, lat2, lon2);
			L.marker([lat1, lon1], { icon: arrowIcon(b), zIndexOffset: 300 }).addTo(map);
		}

		const bounds = L.latLngBounds(latLngs);
		map.fitBounds(bounds, { padding: [20, 20] });

		// Map click → create spectator point if within 50 m of route
		map.on('click', async (e: import('leaflet').LeafletMouseEvent) => {
			const candidates = findAllSnapCandidates(e.latlng.lng, e.latlng.lat, 50);
			if (candidates.length === 0) return;

			// Use nearest for the marker position; order by route distance for crossings
			const nearest = candidates.reduce((a, b) => a.perpDistM < b.perpDistM ? a : b);
			const byDist = [...candidates].sort((a, b) => a.distanceM - b.distanceM);

			const created = await pointsStore.create({
				name: '',
				comment: '',
				lat: nearest.position[1],
				lon: nearest.position[0],
				distance_m: byDist[0].distanceM,
				distance_m_2: byDist[1]?.distanceM ?? null,
			});

			if (!created) return;

			// Manually add marker immediately (before the $effect runs)
			const letter = pointsStore.letterFor(created.id);
			if (!spectatorMarkers.has(created.id)) {
				addSpectatorMarker(created.id, created.lat, created.lon, letter);
			}
			openPointPopup(created);
		});

		mapLoaded = true;

		// Load persisted spectator points
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
