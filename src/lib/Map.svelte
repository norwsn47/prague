<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { ROUTE_COORDS, ROUTE_TOTAL_M, positionAtDistance } from './route.js';
	import { runner1, runner2 } from './runners.svelte.js';
	import { timeState } from './time.svelte.js';

	let mapEl: HTMLDivElement;
	let mapLoaded = $state(false);

	// Held outside $state — Leaflet objects aren't serialisable
	let L: typeof import('leaflet');
	let map: import('leaflet').Map;
	let marker1: import('leaflet').Marker | null = null;
	let marker2: import('leaflet').Marker | null = null;

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

	function arrowIcon(bearingDeg: number): import('leaflet').DivIcon {
		return L.divIcon({
			className: '',
			html: `<svg width="14" height="14" viewBox="0 0 12 12"
				style="display:block;transform:translate(-50%,-50%)">
				<g transform="rotate(${bearingDeg},6,6)">
					<polygon points="6,1 11,11 6,7.5 1,11"
						fill="#3b82f6" fill-opacity="0.85"
						stroke="#0f172a" stroke-width="1" stroke-linejoin="round"/>
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

	$effect(() => {
		if (!mapLoaded) return;
		syncMarker(runner1, marker1, runner1.hexColor, (m) => { marker1 = m; });
		syncMarker(runner2, marker2, runner2.hexColor, (m) => { marker2 = m; });
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

		// Direction arrows every 1 km — ~41 lightweight SVG markers
		const ARROW_INTERVAL_M = 1000;
		for (let d = ARROW_INTERVAL_M; d < ROUTE_TOTAL_M - 200; d += ARROW_INTERVAL_M) {
			const [lon1, lat1] = positionAtDistance(d);
			const [lon2, lat2] = positionAtDistance(Math.min(d + 150, ROUTE_TOTAL_M));
			const b = computeBearing(lat1, lon1, lat2, lon2);
			L.marker([lat1, lon1], { icon: arrowIcon(b), zIndexOffset: 300 }).addTo(map);
		}

		const bounds = L.latLngBounds(latLngs);
		map.fitBounds(bounds, { padding: [20, 20] });

		mapLoaded = true;
	});

	onDestroy(() => {
		map?.remove();
	});
</script>

<div bind:this={mapEl} class="w-full h-full"></div>
