import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	const db = platform?.env?.DB;
	if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 503 });

	const { results } = await db
		.prepare('SELECT * FROM spectator_points ORDER BY distance_m')
		.all();
	return Response.json(results);
};

export const POST: RequestHandler = async ({ platform, request }) => {
	const db = platform?.env?.DB;
	if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 503 });

	const body = (await request.json()) as {
		name: string;
		comment: string;
		lat: number;
		lon: number;
		distance_m: number;
		distance_m_2?: number | null;
	};

	const id = crypto.randomUUID();
	await db
		.prepare(
			'INSERT INTO spectator_points (id, name, comment, lat, lon, distance_m, distance_m_2) VALUES (?, ?, ?, ?, ?, ?, ?)'
		)
		.bind(
			id,
			body.name ?? '',
			body.comment ?? '',
			body.lat,
			body.lon,
			body.distance_m,
			body.distance_m_2 ?? null
		)
		.run();

	return Response.json({ id, ...body }, { status: 201 });
};
