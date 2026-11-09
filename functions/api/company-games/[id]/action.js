import { submitAction } from '../../../../lib/game-engine.js';

export async function onRequestPost(context) {
  const { env, data, params, request } = context;
  const gameId = parseInt(params.id);
  const userId = data.user.id;
  const body = await request.json();

  const { action_type, action_data } = body;
  if (!action_type || !action_data) {
    return new Response(JSON.stringify({ error: 'action_type and action_data are required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await submitAction(env.DB, gameId, userId, action_type, action_data);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
}
