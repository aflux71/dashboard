export async function onRequestGet(context) {
  const { env, params } = context;
  const gameId = parseInt(params.id);

  const game = await env.DB.prepare(`
    SELECT gi.*, gt.key as type_key, gt.name as type_name
    FROM game_instances gi JOIN game_types gt ON gi.game_type_id = gt.id
    WHERE gi.id = ?
  `).bind(gameId).first();

  if (!game) {
    return new Response(JSON.stringify({ error: 'Game not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (game.status !== 'complete') {
    return new Response(JSON.stringify({ error: 'Game is not yet complete' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const players = await env.DB.prepare(`
    SELECT gip.user_id, gip.role, gip.score, gip.status, u.display_name, u.username
    FROM game_instance_players gip JOIN users u ON gip.user_id = u.id
    WHERE gip.game_instance_id = ?
    ORDER BY gip.score DESC
  `).bind(gameId).all();

  const allActions = await env.DB.prepare(`
    SELECT ga.*, u.display_name, u.username
    FROM game_actions ga JOIN users u ON ga.user_id = u.id
    WHERE ga.game_instance_id = ?
    ORDER BY ga.phase_number, ga.submitted_at
  `).bind(gameId).all();

  const gameData = JSON.parse(game.game_data || '{}');

  return new Response(JSON.stringify({
    game_id: game.id,
    type_key: game.type_key,
    type_name: game.type_name,
    game_data: gameData,
    players: (players.results || []).map(p => ({
      user_id: p.user_id,
      display_name: p.display_name || p.username,
      role: p.role,
      score: p.score,
    })),
    actions: (allActions.results || []).map(a => ({
      user_id: a.user_id,
      display_name: a.display_name || a.username,
      phase: a.phase,
      phase_number: a.phase_number,
      action_type: a.action_type,
      action_data: JSON.parse(a.action_data),
      submitted_at: a.submitted_at,
    })),
    completed_at: game.completed_at,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
