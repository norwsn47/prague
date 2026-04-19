<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { ROUTE_COORDS, ROUTE_GEOJSON } from './route.js';

	let mapEl: HTMLDivElement;
	let map: import('leaflet').Map;

	onMount(async () => {
		const L = await import('leaflet');
		await import('leaflet/dist/leaflet.css');

		map = L.map(mapEl, { zoomControl: true }).setView(
			[50.087591, 14.420676],
			13
		);

		L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19,
		}).addTo(map);

		// Draw the route polyline
		const latLngs = ROUTE_COORDS.map(([lon, lat]) => [lat, lon] as [number, number]);
		L.polyline(latLngs, { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(map);

		// Fit map to route bounds
		const bounds = L.latLngBounds(latLngs);
		map.fitBounds(bounds, { padding: [20, 20] });
	});

	onDestroy(() => {
		map?.remove();
	});
</script>

<div bind:this={mapEl} class="w-full h-full"></div>
