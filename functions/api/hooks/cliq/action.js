import { submitAction } from '../../../../lib/game-engine.js';

export async function onRequestPost(context) {
  const { env, request } = context;

  const webhookSecret = env.CLIQ_WEBHOOK_SECRET || 'dev-cliq-secret';
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${webhookSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const { action, game_id, user_email, data } = body;

  const dbUser = user_email
    ? await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(user_email).first()
    : null;

  if (!dbUser) {
    return jsonResponse({ text: 'You need a Staff Dashboard account to play.' });
  }

  switch (action) {
    case 'submit_clue': {
      try {
        const result = await submitAction(env.DB, game_id, dbUser.id, 'clue', { text: data.clue });
        const msg = result.waiting_on > 0
          ? `Clue submitted! Waiting on ${result.waiting_on} more player(s).`
          : 'Clue submitted! All clues are in — advancing to next phase.';
        return jsonResponse({ text: msg });
      } catch (e) {
        return jsonResponse({ text: `Error: ${e.message}` });
      }
    }

    case 'submit_vote': {
      const targetUser = await env.DB.prepare(
        'SELECT id FROM users WHERE username = ? OR display_name = ?'
      ).bind(data.target_name, data.target_name).first();

      if (!targetUser) {
        return jsonResponse({ text: `Couldn't find player "${data.target_name}". Check the spelling and try again.` });
      }

      try {
        const result = await submitAction(env.DB, game_id, dbUser.id, 'vote', { target_user_id: targetUser.id });
        const msg = result.waiting_on > 0
          ? `Vote cast! Waiting on ${result.waiting_on} more vote(s).`
          : 'Vote cast! All votes are in — revealing results!';
        return jsonResponse({ text: msg });
      } catch (e) {
        return jsonResponse({ text: `Error: ${e.message}` });
      }
    }

    default:
      return jsonResponse({ text: `Unknown action: ${action}` });
  }
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}
