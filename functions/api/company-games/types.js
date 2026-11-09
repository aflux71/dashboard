export async function onRequestGet(context) {
  const { env } = context;

  const types = await env.DB.prepare(
    'SELECT id, key, name, description, min_players, max_players, is_active FROM game_types ORDER BY name'
  ).all();

  return new Response(JSON.stringify({ types: types.results || [] }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
