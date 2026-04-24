import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	const db = platform?.env?.DB;
	if (!db) return Response.json({});
	try {
		const { results } = await db.prepare('SELECT key, value FROM settings').all();
		const out: Record<string, string> = {};
		for (const row of results) out[row.key as string] = row.value as string;
		return Response.json(out);
	} catch {
		return Response.json({});
	}
};

export const PATCH: RequestHandler = async ({ platform, request }) => {
	const db = platform?.env?.DB;
	if (!db) return new Response('Service unavailable', { status: 503 });
	try {
		const updates = (await request.json()) as Record<string, string>;
		const entries = Object.entries(updates);
		if (entries.length === 0) return new Response(null, { status: 204 });
		const stmt = db.prepare(
			`INSERT INTO settings (key, value, updated_at)
			 VALUES (?, ?, datetime('now'))
			 ON CONFLICT(key) DO UPDATE SET
			   value      = excluded.value,
			   updated_at = excluded.updated_at`
		);
		await db.batch(entries.map(([k, v]) => stmt.bind(k, String(v))));
		return new Response(null, { status: 204 });
	} catch {
		return new Response('Internal error', { status: 500 });
	}
};
