import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ platform, request, params }) => {
	const db = platform?.env?.DB;
	if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 503 });

	const body = (await request.json()) as { name: string; comment: string };
	await db
		.prepare('UPDATE spectator_points SET name = ?, comment = ? WHERE id = ?')
		.bind(body.name ?? '', body.comment ?? '', params.id)
		.run();

	return Response.json({ ok: true });
};

export const DELETE: RequestHandler = async ({ platform, params }) => {
	const db = platform?.env?.DB;
	if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 503 });

	await db
		.prepare('DELETE FROM spectator_points WHERE id = ?')
		.bind(params.id)
		.run();

	return Response.json({ ok: true });
};
