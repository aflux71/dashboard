export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  let query = `
    SELECT gi.*, gt.key as type_key, gt.name as type_name,
      (SELECT COUNT(*) FROM game_instance_players WHERE game_instance_id = gi.id) as player_count
    FROM game_instances gi
    JOIN game_types gt ON gi.game_type_id = gt.id
  `;
  const params = [];

  if (status) {
    query += ' WHERE gi.status = ?';
    params.push(status);
  }
  query += ' ORDER BY gi.created_at DESC LIMIT ?';
  params.push(limit);

  const games = await env.DB.prepare(query).bind(...params).all();

  return new Response(JSON.stringify({ games: games.results || [] }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
