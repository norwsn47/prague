<script lang="ts">
	import { onMount } from 'svelte';
	import { ROUTE_TOTAL_M } from './route.js';
	import { runner1, runner2 } from './runners.svelte.js';
	import { timeState } from './time.svelte.js';
	import { pointsStore } from './spectatorPoints.svelte.js';

	type ElePoint = { distanceKm: number; elevationM: number };

	let profile = $state<ElePoint[]>([]);
	let loadError = $state('');

	const KM_MARKS = [0, 5, 10, 15, 20, 25, 30, 35, 40];
	const FINISH_KM = Math.round((ROUTE_TOTAL_M / 1000) * 10) / 10;

	function pct(km: number): number {
		return (km * 1000 / ROUTE_TOTAL_M) * 100;
	}

	function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const R = 6371000;
		const dLat = (lat2 - lat1) * Math.PI / 180;
		const dLon = (lon2 - lon1) * Math.PI / 180;
		const a =
			Math.sin(dLat / 2) ** 2 +
			Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	}

	const CHART_H = 80;
	const AXIS_Y = 100;
	const TICK_TOP = 94;
	const PAD_TOP = 8;

	const elevStats = $derived.by(() => {
		if (profile.length < 2) return null;
		const elevs = profile.map(p => p.elevationM);
		const minE = Math.min(...elevs);
		const maxE = Math.max(...elevs);
		const range = maxE - minE || 1;
		const profileMaxKm = profile[profile.length - 1].distanceKm;
		return { minE, range, profileMaxKm };
	});

	const elevPath = $derived.by(() => {
		if (!elevStats) return null;
		const { minE, range, profileMaxKm } = elevStats;
		const pts = profile.map(p => {
			const x = (p.distanceKm / profileMaxKm) * 1000;
			const y = AXIS_Y - PAD_TOP - ((p.elevationM - minE) / range) * (CHART_H - PAD_TOP);
			return `${x},${y}`;
		});
		const firstX = (profile[0].distanceKm / profileMaxKm) * 1000;
		const lastX = (profile[profile.length - 1].distanceKm / profileMaxKm) * 1000;
		return {
			line: `M ${pts.join(' L ')}`,
			fill: `M ${firstX},${AXIS_Y} L ${pts.join(' L ')} L ${lastX},${AXIS_Y} Z`,
		};
	});

	function interpolateElev(distKm: number): number {
		if (profile.length === 0) return 0;
		if (distKm <= profile[0].distanceKm) return profile[0].elevationM;
		for (let i = 1; i < profile.length; i++) {
			if (profile[i].distanceKm >= distKm) {
				const a = profile[i - 1], b = profile[i];
				const t = (distKm - a.distanceKm) / (b.distanceKm - a.distanceKm);
				return a.elevationM + t * (b.elevationM - a.elevationM);
			}
		}
		return profile[profile.length - 1].elevationM;
	}

	type Marker = {
		color: string;
		borderColor: string;
		xPct: number;
		dotYPct: number;
		label: string;
		labelTopPx: number;
		labelTransform: string;
	};

	const visiblePoints = $derived.by(() => {
		return pointsStore.sorted.filter(point => {
			const distances = point.distance_m_2 != null
				? [point.distance_m, point.distance_m_2]
				: [point.distance_m];
			const runners = [
				{ r: runner1, ri: 0 },
				{ r: runner2, ri: 1 },
			];
			for (const [di] of distances.entries()) {
				for (const { r, ri } of runners) {
					if (!r.isValid) continue;
					if (!pointsStore.isSlotHidden(point.id, `${di}-${ri}`)) return true;
				}
			}
			return false;
		});
	});

	const runnerMarkers = $derived.by((): Marker[] => {
		if (!elevStats || profile.length === 0) return [];
		const { minE, range, profileMaxKm } = elevStats;

		const defs = [
			{ runner: runner1, name: 'Will',   color: '#4d7a5f', borderColor: '#a8c4b4', labelTopPx: 4  },
			{ runner: runner2, name: 'Maggie', color: '#9e6080', borderColor: '#c4a8b8', labelTopPx: 26 },
		];

		return defs
			.filter(d => d.runner.isValid)
			.map(({ runner, name, color, borderColor, labelTopPx }): Marker => {
				const elapsed = timeState.current - runner.startSeconds;
				const distM = elapsed < 0 ? 0 : Math.min(elapsed / runner.pacePerMetre, 42195);
				const distKm = distM / 1000;
				const elev = interpolateElev(distKm);

				const xPct = Math.min((distKm / profileMaxKm) * 100, 100);
				const y_vb = AXIS_Y - PAD_TOP - ((elev - minE) / range) * (CHART_H - PAD_TOP);
				const dotYPct = (y_vb / AXIS_Y) * 100;

				const label =
					elapsed < 0    ? `${name} — at start` :
					distM >= 42195 ? `${name} — finished` :
					                 `${name} — ${distKm.toFixed(1)} km`;

				const labelTransform =
					xPct < 8  ? 'translateX(0)' :
					xPct > 92 ? 'translateX(-100%)' :
					            'translateX(-50%)';

				return { color, borderColor, xPct, dotYPct, label, labelTopPx, labelTransform };
			});
	});

	onMount(async () => {
		try {
			const res = await fetch('/route.gpx');
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const xml = await res.text();
			const doc = new DOMParser().parseFromString(xml, 'application/xml');
			const trkpts = Array.from(doc.getElementsByTagName('trkpt'));

			if (trkpts.length === 0) { loadError = 'No track points found in GPX'; return; }

			let cumDist = 0;
			let prevLat: number | null = null;
			let prevLon: number | null = null;
			const pts: ElePoint[] = [];

			for (const pt of trkpts) {
				const lat = parseFloat(pt.getAttribute('lat') ?? '');
				const lon = parseFloat(pt.getAttribute('lon') ?? '');
				const eleEl = pt.getElementsByTagName('ele')[0];
				const ele = eleEl ? parseFloat(eleEl.textContent ?? '') : null;
				if (isNaN(lat) || isNaN(lon) || ele === null || isNaN(ele)) continue;
				if (prevLat !== null && prevLon !== null) cumDist += haversineM(prevLat, prevLon, lat, lon);
				prevLat = lat; prevLon = lon;
				pts.push({ distanceKm: cumDist / 1000, elevationM: ele });
			}

			if (pts.length === 0) { loadError = 'Elevation data not found in GPX'; return; }
			profile = pts;
		} catch (e) {
			loadError = String(e);
		}
	});
</script>

<div class="relative w-full h-full select-none overflow-hidden" style="background:var(--surface)">

	<!-- Elevation SVG -->
	<svg
		class="absolute inset-x-0 top-0 w-full"
		style="height: calc(100% - 24px)"
		viewBox="0 0 1000 {AXIS_Y}"
		preserveAspectRatio="none"
		aria-hidden="true"
	>
		<rect width="1000" height={AXIS_Y} fill="#F5F6F4" />

		{#each [25, 50, 75] as y}
			<line x1="0" y1={y} x2="1000" y2={y} stroke="#EEEEEE" stroke-width="1" />
		{/each}

		<line x1="0" y1={AXIS_Y} x2="1000" y2={AXIS_Y} stroke="#E0E0E0" stroke-width="1.5" />

		{#each KM_MARKS as km}
			<line
				x1={(km * 1000 / ROUTE_TOTAL_M) * 1000}
				y1={TICK_TOP}
				x2={(km * 1000 / ROUTE_TOTAL_M) * 1000}
				y2={AXIS_Y}
				stroke="#E0E0E0"
				stroke-width="1"
			/>
		{/each}
		<line x1="1000" y1={TICK_TOP} x2="1000" y2={AXIS_Y} stroke="#E0E0E0" stroke-width="1" />

		{#if elevPath}
			<path d={elevPath.fill} fill="#4D8898" fill-opacity="0.10" />
			<path d={elevPath.line} fill="none" stroke="#4D8898" stroke-width="1.5" stroke-linejoin="round" />
		{:else if loadError}
			<text x="500" y="52" text-anchor="middle" font-size="11" fill="#9E9E9E"
				font-family="-apple-system,BlinkMacSystemFont,sans-serif">{loadError}</text>
		{:else}
			<text x="500" y="52" text-anchor="middle" font-size="11" fill="#9E9E9E"
				font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-weight="600" letter-spacing="2"
			>ELEVATION</text>
		{/if}
	</svg>

	<!--
		Runner marker overlay — HTML elements to avoid SVG text/shape distortion.
	-->
	<div class="absolute inset-x-0 top-0 pointer-events-none" style="height: calc(100% - 24px)">
		{#each runnerMarkers as m}
			<!-- Guide line from top:0 to the dot -->
			<div style="
				position:absolute;
				left:{m.xPct}%;
				top:0;
				width:1px;
				height:{m.dotYPct}%;
				transform:translateX(-50%);
				background:{m.color};
				opacity:0.25;
			"></div>

			<!-- Dot at actual elevation position -->
			<div style="
				position:absolute;
				left:{m.xPct}%;
				top:{m.dotYPct}%;
				width:10px;height:10px;
				border-radius:50%;
				background:{m.color};
				border:2px solid white;
				box-shadow:0 1px 3px rgba(0,0,0,0.25);
				transform:translate(-50%,-50%);
			"></div>

			<!-- Pinned label — fixed near top, transform shifts to avoid edge clipping -->
			<div style="
				position:absolute;
				left:{m.xPct}%;
				top:{m.labelTopPx}px;
				transform:{m.labelTransform};
				background:var(--surface,#fff);
				border:1.5px solid {m.borderColor};
				border-radius:6px;
				padding:2px 7px;
				font-size:10px;font-weight:700;
				letter-spacing:0.01em;
				font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;
				color:{m.color};
				white-space:nowrap;
				box-shadow:0 1px 4px rgba(15,23,42,0.10);
			">{m.label}</div>
		{/each}

		<!-- Spectator point dashed lines (non-interactive) -->
		{#each visiblePoints as point}
			{@const xPct = (point.distance_m / ROUTE_TOTAL_M) * 100}
			<div style="
				position:absolute;
				left:{xPct}%;
				top:0;
				width:1px;
				height:100%;
				transform:translateX(-50%);
				background:repeating-linear-gradient(to bottom, #8AC0BC 0px, #8AC0BC 3px, transparent 3px, transparent 7px);
				opacity:0.55;
			"></div>
		{/each}
	</div>

	<!-- Spectator point letter badges — clickable, rendered above x-axis labels -->
	{#each visiblePoints as point}
		{@const xPct = (point.distance_m / ROUTE_TOTAL_M) * 100}
		{@const letter = pointsStore.letterFor(point.id)}
		{@const shift = xPct < 5 ? 'translateX(0)' : xPct > 95 ? 'translateX(-100%)' : 'translateX(-50%)'}
		<button
			onclick={() => { pointsStore.openPopupId = point.id; }}
			title="{letter}{point.name ? ` — ${point.name}` : ''}"
			style="
				position:absolute;
				left:{xPct}%;
				bottom:2px;
				transform:{shift};
				z-index:10;
				width:16px; height:16px;
				border-radius:50%;
				background:#4D8898;
				border:1.5px solid white;
				box-shadow:0 1px 3px rgba(0,0,0,0.20);
				color:white;
				font-size:9px; font-weight:700;
				display:flex; align-items:center; justify-content:center;
				cursor:pointer;
				font-family:-apple-system,BlinkMacSystemFont,sans-serif;
				padding:0;
			"
		>{letter}</button>
	{/each}

	<!-- X-axis distance labels -->
	<div class="absolute bottom-0 left-0 right-0 h-6">
		<span class="absolute left-0 bottom-1 label-caps" style="font-size:10px;letter-spacing:0;text-transform:none;color:var(--t3)">0km</span>
		{#each KM_MARKS.slice(1) as km}
			<span
				class="absolute bottom-1 -translate-x-1/2 label-caps"
				style="left:{pct(km)}%;font-size:10px;letter-spacing:0;text-transform:none;color:var(--t3)"
			>{km}km</span>
		{/each}
		<span class="absolute right-0 bottom-1 label-caps" style="font-size:10px;letter-spacing:0;text-transform:none;color:var(--t3)">{FINISH_KM}km</span>
	</div>

</div>
