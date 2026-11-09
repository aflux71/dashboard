import { getGameStatus } from '../../../../lib/game-engine.js';

export async function onRequestGet(context) {
  const { env, data, params } = context;
  const gameId = parseInt(params.id);
  const userId = data.user.id;

  const status = await getGameStatus(env.DB, gameId, userId);
  if (!status) {
    return new Response(JSON.stringify({ error: 'Game not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(status), {
    headers: { 'Content-Type': 'application/json' },
  });
}
