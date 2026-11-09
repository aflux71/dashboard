import { createGame } from '../../../lib/game-engine.js';

export async function onRequestPost(context) {
  const { env, data, request } = context;
  const user = data.user;
  if (!user.is_admin) {
    return new Response(JSON.stringify({ error: 'Only admins can create games' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const { game_type } = body;
  if (!game_type) {
    return new Response(JSON.stringify({ error: 'game_type is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await createGame(env.DB, game_type, user.id);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
}
