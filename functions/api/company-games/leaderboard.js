import { getCurrentSeason } from '../../../lib/game-engine.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const season = url.searchParams.get('season') || getCurrentSeason();
  const gameType = url.searchParams.get('game_type');
  const limit = parseInt(url.searchParams.get('limit') || '25');

  let query, params;

  if (gameType) {
    query = `
      SELECT gl.*, u.display_name, u.username
      FROM game_leaderboard gl JOIN users u ON gl.user_id = u.id
      WHERE gl.season = ? AND gl.game_type_key = ?
      ORDER BY gl.total_score DESC LIMIT ?
    `;
    params = [season, gameType, limit];
  } else {
    query = `
      SELECT gl.user_id, u.display_name, u.username,
        SUM(gl.games_played) as games_played,
        SUM(gl.games_won) as games_won,
        SUM(gl.total_score) as total_score
      FROM game_leaderboard gl JOIN users u ON gl.user_id = u.id
      WHERE gl.season = ?
      GROUP BY gl.user_id
      ORDER BY total_score DESC LIMIT ?
    `;
    params = [season, limit];
  }

  const rows = await env.DB.prepare(query).bind(...params).all();

  const availableSeasons = await env.DB.prepare(
    'SELECT DISTINCT season FROM game_leaderboard ORDER BY season DESC LIMIT 12'
  ).all();

  return new Response(JSON.stringify({
    season,
    leaderboard: (rows.results || []).map((r, i) => ({
      rank: i + 1,
      user_id: r.user_id,
      display_name: r.display_name || r.username,
      games_played: r.games_played,
      games_won: r.games_won,
      total_score: r.total_score,
    })),
    seasons: (availableSeasons.results || []).map(s => s.season),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
