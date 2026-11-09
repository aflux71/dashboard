import { getPlugin } from './game-plugins.js';

export function getCurrentSeason() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 3600000).toISOString();
}

export async function createGame(db, gameTypeKey, createdBy) {
  const gameType = await db.prepare(
    'SELECT * FROM game_types WHERE key = ? AND is_active = 1'
  ).bind(gameTypeKey).first();
  if (!gameType) throw new Error(`Unknown game type: ${gameTypeKey}`);

  const config = JSON.parse(gameType.config || '{}');
  const regHours = config.phase_hours?.registration || 48;

  const result = await db.prepare(`
    INSERT INTO game_instances (game_type_id, season, status, current_phase, phase_number, phase_deadline, game_data, created_by)
    VALUES (?, ?, 'registration', 'registration', 0, ?, '{}', ?)
  `).bind(gameType.id, getCurrentSeason(), hoursFromNow(regHours), createdBy).run();

  return {
    id: result.meta.last_row_id,
    game_type: gameType,
    phase_deadline: hoursFromNow(regHours),
  };
}

export async function joinGame(db, gameInstanceId, userId) {
  const game = await db.prepare(
    'SELECT gi.*, gt.key as type_key, gt.min_players, gt.max_players FROM game_instances gi JOIN game_types gt ON gi.game_type_id = gt.id WHERE gi.id = ?'
  ).bind(gameInstanceId).first();
  if (!game) throw new Error('Game not found');
  if (game.status !== 'registration') throw new Error('Registration is closed');

  const existing = await db.prepare(
    'SELECT id FROM game_instance_players WHERE game_instance_id = ? AND user_id = ?'
  ).bind(gameInstanceId, userId).first();
  if (existing) throw new Error('Already joined');

  const count = await db.prepare(
    'SELECT COUNT(*) as cnt FROM game_instance_players WHERE game_instance_id = ?'
  ).bind(gameInstanceId).first();
  if (count.cnt >= game.max_players) throw new Error('Game is full');

  await db.prepare(
    'INSERT INTO game_instance_players (game_instance_id, user_id) VALUES (?, ?)'
  ).bind(gameInstanceId, userId).run();

  return { player_count: count.cnt + 1, max_players: game.max_players };
}

export async function getGameStatus(db, gameInstanceId, userId) {
  const game = await db.prepare(`
    SELECT gi.*, gt.key as type_key, gt.name as type_name, gt.min_players, gt.max_players, gt.config as type_config
    FROM game_instances gi JOIN game_types gt ON gi.game_type_id = gt.id WHERE gi.id = ?
  `).bind(gameInstanceId).first();
  if (!game) return null;

  const players = await db.prepare(`
    SELECT gip.*, u.display_name, u.username
    FROM game_instance_players gip JOIN users u ON gip.user_id = u.id
    WHERE gip.game_instance_id = ?
  `).bind(gameInstanceId).all();

  const actions = await db.prepare(`
    SELECT user_id, phase, phase_number, action_type
    FROM game_actions WHERE game_instance_id = ? AND phase = ? AND phase_number = ?
  `).bind(gameInstanceId, game.current_phase, game.phase_number).all();

  const submittedUserIds = new Set((actions.results || []).map(a => a.user_id));

  let myRole = null;
  let mySecret = null;
  if (userId) {
    const myPlayer = (players.results || []).find(p => p.user_id === userId);
    if (myPlayer) {
      myRole = myPlayer.role;
      mySecret = myPlayer.secret_data ? JSON.parse(myPlayer.secret_data) : null;
    }
  }

  return {
    id: game.id,
    type_key: game.type_key,
    type_name: game.type_name,
    status: game.status,
    current_phase: game.current_phase,
    phase_number: game.phase_number,
    phase_deadline: game.phase_deadline,
    player_count: (players.results || []).length,
    min_players: game.min_players,
    max_players: game.max_players,
    players: (players.results || []).map(p => ({
      user_id: p.user_id,
      display_name: p.display_name,
      status: p.status,
      has_submitted: submittedUserIds.has(p.user_id),
    })),
    my_role: myRole,
    my_secret: mySecret,
    game_data: game.status === 'complete' ? JSON.parse(game.game_data || '{}') : undefined,
    created_at: game.created_at,
  };
}

export async function submitAction(db, gameInstanceId, userId, actionType, actionData) {
  const game = await db.prepare(`
    SELECT gi.*, gt.key as type_key, gt.config as type_config
    FROM game_instances gi JOIN game_types gt ON gi.game_type_id = gt.id WHERE gi.id = ?
  `).bind(gameInstanceId).first();
  if (!game) throw new Error('Game not found');
  if (game.status !== 'active' && game.status !== 'voting') throw new Error('Game is not accepting actions');

  const player = await db.prepare(
    'SELECT * FROM game_instance_players WHERE game_instance_id = ? AND user_id = ?'
  ).bind(gameInstanceId, userId).first();
  if (!player) throw new Error('You are not in this game');
  if (player.status === 'eliminated') throw new Error('You have been eliminated');

  const existing = await db.prepare(
    'SELECT id FROM game_actions WHERE game_instance_id = ? AND user_id = ? AND phase = ? AND phase_number = ?'
  ).bind(gameInstanceId, userId, game.current_phase, game.phase_number).first();
  if (existing) throw new Error('You already submitted for this phase');

  const plugin = getPlugin(game.type_key);
  if (plugin.validateAction) {
    const validation = plugin.validateAction(game, player, actionType, actionData);
    if (!validation.valid) throw new Error(validation.error);
  }

  await db.prepare(`
    INSERT INTO game_actions (game_instance_id, user_id, phase, phase_number, action_type, action_data)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(gameInstanceId, userId, game.current_phase, game.phase_number, actionType, JSON.stringify(actionData)).run();

  const allPlayers = await db.prepare(
    "SELECT user_id FROM game_instance_players WHERE game_instance_id = ? AND status = 'active'"
  ).bind(gameInstanceId).all();
  const allActions = await db.prepare(
    'SELECT user_id FROM game_actions WHERE game_instance_id = ? AND phase = ? AND phase_number = ?'
  ).bind(gameInstanceId, game.current_phase, game.phase_number).all();

  const activePlayers = (allPlayers.results || []).length;
  const submissions = (allActions.results || []).length;

  if (submissions >= activePlayers) {
    await advancePhase(db, game);
  }

  return { submitted: true, waiting_on: activePlayers - submissions };
}

export async function advancePhase(db, game) {
  if (typeof game === 'number') {
    game = await db.prepare(`
      SELECT gi.*, gt.key as type_key, gt.config as type_config
      FROM game_instances gi JOIN game_types gt ON gi.game_type_id = gt.id WHERE gi.id = ?
    `).bind(game).first();
  }
  if (!game || game.status === 'complete' || game.status === 'cancelled') return;

  const plugin = getPlugin(game.type_key);
  const config = JSON.parse(game.type_config || '{}');
  const gameData = JSON.parse(game.game_data || '{}');

  const players = await db.prepare(
    'SELECT * FROM game_instance_players WHERE game_instance_id = ?'
  ).bind(game.id).all();

  const actions = await db.prepare(
    'SELECT * FROM game_actions WHERE game_instance_id = ? AND phase = ? AND phase_number = ?'
  ).bind(game.id, game.current_phase, game.phase_number).all();

  const context = {
    game,
    config,
    gameData,
    players: players.results || [],
    actions: (actions.results || []).map(a => ({ ...a, action_data: JSON.parse(a.action_data) })),
    db,
  };

  if (game.current_phase === 'registration') {
    const playerCount = (players.results || []).length;
    if (playerCount < (game.min_players || 4)) {
      await db.prepare("UPDATE game_instances SET status = 'cancelled', completed_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(game.id).run();
      return { cancelled: true, reason: 'Not enough players' };
    }
    const startResult = plugin.onStart(context);
    for (const pa of startResult.playerAssignments) {
      await db.prepare(
        'UPDATE game_instance_players SET role = ?, secret_data = ? WHERE game_instance_id = ? AND user_id = ?'
      ).bind(pa.role, JSON.stringify(pa.secret), game.id, pa.user_id).run();
    }
    const nextPhase = startResult.nextPhase;
    const phaseHours = config.phase_hours?.[nextPhase.key] || 24;
    await db.prepare(`
      UPDATE game_instances SET status = 'active', current_phase = ?, phase_number = 1,
        phase_deadline = ?, game_data = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(nextPhase.key, hoursFromNow(phaseHours), JSON.stringify(startResult.gameData), game.id).run();

    await queueNotifications(db, game.id, startResult.notifications || []);
    return { advanced: true, phase: nextPhase.key };
  }

  const phaseResult = plugin.onPhaseEnd(context);

  if (phaseResult.playerUpdates) {
    for (const pu of phaseResult.playerUpdates) {
      const sets = [];
      const vals = [];
      if (pu.status) { sets.push('status = ?'); vals.push(pu.status); }
      if (pu.score !== undefined) { sets.push('score = score + ?'); vals.push(pu.score); }
      if (sets.length > 0) {
        vals.push(game.id, pu.user_id);
        await db.prepare(
          `UPDATE game_instance_players SET ${sets.join(', ')} WHERE game_instance_id = ? AND user_id = ?`
        ).bind(...vals).run();
      }
    }
  }

  const updatedGameData = { ...gameData, ...phaseResult.gameData };

  if (phaseResult.complete) {
    await db.prepare(`
      UPDATE game_instances SET status = 'complete', current_phase = 'complete', game_data = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(JSON.stringify(updatedGameData), game.id).run();

    await updateLeaderboard(db, game, players.results || []);
    await queueNotifications(db, game.id, phaseResult.notifications || []);
    return { complete: true };
  }

  const nextPhase = phaseResult.nextPhase;
  const phaseHours = config.phase_hours?.[nextPhase.key] || 24;
  const newStatus = nextPhase.key === 'voting' ? 'voting' : 'active';
  await db.prepare(`
    UPDATE game_instances SET status = ?, current_phase = ?, phase_number = ?,
      phase_deadline = ?, game_data = ? WHERE id = ?
  `).bind(newStatus, nextPhase.key, (game.phase_number || 0) + 1, hoursFromNow(phaseHours), JSON.stringify(updatedGameData), game.id).run();

  await queueNotifications(db, game.id, phaseResult.notifications || []);
  return { advanced: true, phase: nextPhase.key };
}

export async function checkExpiredPhases(db) {
  const now = new Date().toISOString();
  const expired = await db.prepare(`
    SELECT gi.id FROM game_instances gi
    WHERE gi.status IN ('registration', 'active', 'voting')
      AND gi.phase_deadline <= ?
  `).bind(now).all();

  const results = [];
  for (const row of (expired.results || [])) {
    const result = await advancePhase(db, row.id);
    results.push({ game_id: row.id, ...result });
  }
  return results;
}

async function updateLeaderboard(db, game, players) {
  const gameType = await db.prepare('SELECT key FROM game_types WHERE id = ?').bind(game.game_type_id).first();
  if (!gameType) return;

  const finalPlayers = await db.prepare(
    'SELECT * FROM game_instance_players WHERE game_instance_id = ?'
  ).bind(game.id).all();

  for (const p of (finalPlayers.results || [])) {
    const won = p.score > 0 ? 1 : 0;
    await db.prepare(`
      INSERT INTO game_leaderboard (user_id, game_type_key, season, games_played, games_won, total_score, last_played_at)
      VALUES (?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, game_type_key, season) DO UPDATE SET
        games_played = games_played + 1,
        games_won = games_won + ?,
        total_score = total_score + ?,
        last_played_at = CURRENT_TIMESTAMP
    `).bind(p.user_id, gameType.key, game.season || getCurrentSeason(), won, p.score, won, p.score).run();
  }
}

async function queueNotifications(db, gameInstanceId, notifications) {
  for (const n of notifications) {
    await db.prepare(`
      INSERT INTO game_notifications (game_instance_id, user_id, channel, message_type, message, send_after)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      gameInstanceId,
      n.user_id || null,
      n.channel || 'dm',
      n.type || 'info',
      n.message,
      n.send_after || new Date().toISOString()
    ).run();
  }
}

export async function getPendingNotifications(db, limit = 50) {
  const now = new Date().toISOString();
  const rows = await db.prepare(`
    SELECT gn.*, gi.id as game_id, gt.name as game_name
    FROM game_notifications gn
    JOIN game_instances gi ON gn.game_instance_id = gi.id
    JOIN game_types gt ON gi.game_type_id = gt.id
    WHERE gn.status = 'pending' AND gn.send_after <= ?
    ORDER BY gn.send_after ASC LIMIT ?
  `).bind(now, limit).all();
  return rows.results || [];
}

export async function markNotificationSent(db, notificationId) {
  await db.prepare(
    "UPDATE game_notifications SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(notificationId).run();
}
