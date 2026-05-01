import { positionAtDistance } from './route.js';

export const WATER_STATION_KM = [
	4, 6.6, 8.5, 10.3, 13.5, 15.6, 18.2, 21, 23.6, 26.1, 28, 30.5, 33.5, 36.1, 38, 39.7,
];

export type WaterStation = {
	id: string;
	km: number;
	distM: number;
	lat: number;
	lon: number;
};

export const WATER_STATIONS: WaterStation[] = WATER_STATION_KM.map((km, i) => {
	const distM = km * 1000;
	const [lon, lat] = positionAtDistance(distM);
	return { id: `ws-${i}`, km, distM, lat, lon };
});
