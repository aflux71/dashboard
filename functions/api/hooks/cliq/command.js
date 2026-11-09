import { createGame, joinGame, getGameStatus } from '../../../../lib/game-engine.js';
import { getCurrentSeason } from '../../../../lib/game-engine.js';

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
  const { command, args, user_email } = body;

  const dbUser = user_email
    ? await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(user_email).first()
    : null;

  if (!dbUser) {
    return cliqResponse('You need a Staff Dashboard account to play. Ask your admin to add you.');
  }

  switch (command) {
    case 'start': return handleStart(env.DB, dbUser, args);
    case 'join':  return handleJoin(env.DB, dbUser, args);
    case 'status': return handleStatus(env.DB, dbUser, args);
    case 'leaderboard': return handleLeaderboard(env.DB, args);
    case 'help':
    default:
      return handleHelp();
  }
}

async function handleStart(db, user, args) {
  if (!user.is_admin) {
    return cliqResponse('Only admins can start new games.');
  }
  const gameType = args?.game_type || 'spy';
  try {
    const result = await createGame(db, gameType, user.id);
    return cliqResponse(
      `New **${gameType}** game created (ID: ${result.id})!\n` +
      `Registration is open until ${new Date(result.phase_deadline).toLocaleString()}.\n` +
      `Players can join with: \`/game join ${result.id}\``
    );
  } catch (e) {
    return cliqResponse(`Failed to create game: ${e.message}`);
  }
}

async function handleJoin(db, user, args) {
  const gameId = args?.game_id;
  if (!gameId) {
    const latest = await db.prepare(
      "SELECT id FROM game_instances WHERE status = 'registration' ORDER BY created_at DESC LIMIT 1"
    ).first();
    if (!latest) return cliqResponse('No games are currently open for registration.');
    return handleJoinById(db, user, latest.id);
  }
  return handleJoinById(db, user, parseInt(gameId));
}

async function handleJoinById(db, user, gameId) {
  try {
    const result = await joinGame(db, gameId, user.id);
    return cliqResponse(`You're in! (${result.player_count}/${result.max_players} players). Waiting for the game to start...`);
  } catch (e) {
    return cliqResponse(`Couldn't join: ${e.message}`);
  }
}

async function handleStatus(db, user, args) {
  const gameId = args?.game_id;
  let game;
  if (gameId) {
    game = await getGameStatus(db, parseInt(gameId), user.id);
  } else {
    const latest = await db.prepare(
      "SELECT id FROM game_instances WHERE status != 'complete' AND status != 'cancelled' ORDER BY created_at DESC LIMIT 1"
    ).first();
    if (!latest) return cliqResponse('No active games right now.');
    game = await getGameStatus(db, latest.id, user.id);
  }

  if (!game) return cliqResponse('Game not found.');

  const submitted = game.players.filter(p => p.has_submitted).length;
  const active = game.players.filter(p => p.status === 'active').length;
  const deadline = game.phase_deadline ? new Date(game.phase_deadline).toLocaleString() : 'N/A';

  let msg = `**${game.type_name}** (Game #${game.id})\n`;
  msg += `Status: ${game.status} | Phase: ${game.current_phase}\n`;
  msg += `Players: ${game.player_count} | Submitted: ${submitted}/${active}\n`;
  msg += `Deadline: ${deadline}`;

  if (game.my_secret?.word) {
    msg += `\n\nYour word: **${game.my_secret.word}**`;
  }

  return cliqResponse(msg);
}

async function handleLeaderboard(db, args) {
  const season = args?.season || getCurrentSeason();
  const rows = await db.prepare(`
    SELECT gl.user_id, u.display_name, u.username,
      SUM(gl.games_played) as played, SUM(gl.games_won) as won, SUM(gl.total_score) as score
    FROM game_leaderboard gl JOIN users u ON gl.user_id = u.id
    WHERE gl.season = ?
    GROUP BY gl.user_id ORDER BY score DESC LIMIT 10
  `).bind(season).all();

  if (!rows.results?.length) return cliqResponse(`No games played this season (${season}) yet!`);

  let msg = `**Leaderboard — ${season}**\n`;
  (rows.results || []).forEach((r, i) => {
    const medal = i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`;
    msg += `${medal} ${r.display_name || r.username} — ${r.score} pts (${r.won}W/${r.played}P)\n`;
  });

  return cliqResponse(msg);
}

function handleHelp() {
  return cliqResponse(
    '**Company Games Commands:**\n' +
    '`/game join [id]` — Join the latest open game (or a specific one)\n' +
    '`/game status [id]` — Check current game status & your word\n' +
    '`/game leaderboard` — See this month\'s top players\n' +
    '`/game start <type>` — (Admin) Start a new game (spy, trivia, word_chain)\n' +
    '`/game help` — Show this help message'
  );
}

function cliqResponse(text) {
  return new Response(JSON.stringify({ text }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
