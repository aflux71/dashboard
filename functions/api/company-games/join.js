import { joinGame } from '../../../lib/game-engine.js';

export async function onRequestPost(context) {
  const { env, data, request } = context;
  const user = data.user;
  const body = await request.json();
  const { game_id } = body;

  if (!game_id) {
    return new Response(JSON.stringify({ error: 'game_id is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await joinGame(env.DB, game_id, user.id);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
}
