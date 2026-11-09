import { getRandomPair } from './word-pairs.js';

const plugins = {};

// ─── WHO IS THE SPY ────────────────────────────────────────
plugins.spy = {
  key: 'spy',
  phases: ['clue_1', 'clue_2', 'voting'],

  onStart(ctx) {
    const { players, config } = ctx;
    const activePlayers = players.filter(p => p.status === 'active');
    const spyCount = config.spy_count || 1;

    const [civilianWord, spyWord] = getRandomPair();
    const shuffled = [...activePlayers].sort(() => Math.random() - 0.5);
    const spyIds = new Set(shuffled.slice(0, spyCount).map(p => p.user_id));

    const assignments = activePlayers.map(p => ({
      user_id: p.user_id,
      role: spyIds.has(p.user_id) ? 'spy' : 'civilian',
      secret: {
        word: spyIds.has(p.user_id) ? spyWord : civilianWord,
        is_spy: spyIds.has(p.user_id),
      },
    }));

    const notifications = activePlayers.map(p => ({
      user_id: p.user_id,
      channel: 'dm',
      type: 'game_start',
      message: spyIds.has(p.user_id)
        ? `The game has started! Your word is: **${spyWord}**. You are the SPY — blend in and don't get caught!`
        : `The game has started! Your word is: **${civilianWord}**. Someone among you has a different word — find the spy!`,
    }));

    return {
      playerAssignments: assignments,
      gameData: {
        civilian_word: civilianWord,
        spy_word: spyWord,
        spy_ids: Array.from(spyIds),
        clue_history: [],
      },
      nextPhase: { key: 'clue_1' },
      notifications,
    };
  },

  validateAction(game, player, actionType, actionData) {
    if (game.current_phase.startsWith('clue')) {
      if (actionType !== 'clue') return { valid: false, error: 'Expected a clue for this phase' };
      if (!actionData.text || actionData.text.trim().length === 0) return { valid: false, error: 'Clue cannot be empty' };
      if (actionData.text.trim().length > 200) return { valid: false, error: 'Clue must be under 200 characters' };
      return { valid: true };
    }
    if (game.current_phase === 'voting') {
      if (actionType !== 'vote') return { valid: false, error: 'Expected a vote for this phase' };
      if (!actionData.target_user_id) return { valid: false, error: 'Must vote for a player' };
      if (actionData.target_user_id === player.user_id) return { valid: false, error: 'Cannot vote for yourself' };
      return { valid: true };
    }
    return { valid: false, error: 'Unexpected action for current phase' };
  },

  onPhaseEnd(ctx) {
    const { game, gameData, actions, players, config } = ctx;

    if (game.current_phase === 'clue_1') {
      const clues = actions.map(a => ({
        user_id: a.user_id,
        clue: a.action_data.text,
        round: 1,
      }));
      const updatedHistory = [...(gameData.clue_history || []), ...clues];

      const notifications = [{
        channel: 'channel',
        type: 'clue_reveal',
        message: formatClueReveal(clues, players, 1),
      }];
      players.filter(p => p.status === 'active').forEach(p => {
        notifications.push({
          user_id: p.user_id,
          channel: 'dm',
          type: 'phase_start',
          message: 'Round 2 clues are open. Submit your next clue — be careful not to give too much away!',
        });
      });

      return {
        gameData: { clue_history: updatedHistory },
        nextPhase: { key: 'clue_2' },
        notifications,
      };
    }

    if (game.current_phase === 'clue_2') {
      const clues = actions.map(a => ({
        user_id: a.user_id,
        clue: a.action_data.text,
        round: 2,
      }));
      const updatedHistory = [...(gameData.clue_history || []), ...clues];

      const notifications = [{
        channel: 'channel',
        type: 'clue_reveal',
        message: formatClueReveal(clues, players, 2),
      }];
      players.filter(p => p.status === 'active').forEach(p => {
        notifications.push({
          user_id: p.user_id,
          channel: 'dm',
          type: 'voting_start',
          message: 'All clues are in! Time to vote — who do you think is the spy? Reply with their name.',
        });
      });

      return {
        gameData: { clue_history: updatedHistory },
        nextPhase: { key: 'voting' },
        notifications,
      };
    }

    if (game.current_phase === 'voting') {
      return resolveVoting(ctx);
    }

    return { complete: true, gameData: {} };
  },
};

function resolveVoting(ctx) {
  const { gameData, actions, players } = ctx;
  const spyIds = new Set(gameData.spy_ids || []);

  const votes = {};
  for (const a of actions) {
    const target = a.action_data.target_user_id;
    votes[target] = (votes[target] || 0) + 1;
  }

  let maxVotes = 0;
  let votedOut = null;
  for (const [userId, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      votedOut = parseInt(userId);
    }
  }

  const spyCaught = votedOut && spyIds.has(votedOut);
  const activePlayers = players.filter(p => p.status === 'active');
  const playerUpdates = [];

  for (const p of activePlayers) {
    let score = 0;
    if (spyIds.has(p.user_id)) {
      score = spyCaught ? 0 : 20;
    } else {
      const myVote = actions.find(a => a.user_id === p.user_id);
      if (myVote && spyIds.has(myVote.action_data.target_user_id)) {
        score = 15;
      } else {
        score = 0;
      }
    }
    playerUpdates.push({ user_id: p.user_id, score });
  }

  const playerMap = {};
  for (const p of players) playerMap[p.user_id] = p;

  const votedOutName = votedOut && playerMap[votedOut]
    ? (playerMap[votedOut].display_name || playerMap[votedOut].username || `Player ${votedOut}`)
    : 'No one';

  const spyNames = Array.from(spyIds).map(id =>
    playerMap[id] ? (playerMap[id].display_name || playerMap[id].username || `Player ${id}`) : `Player ${id}`
  ).join(', ');

  let resultMessage;
  if (spyCaught) {
    resultMessage = `The group voted for **${votedOutName}** — and they were the SPY!\n` +
      `The civilian word was **${gameData.civilian_word}**, the spy had **${gameData.spy_word}**.\n` +
      `Civilians who voted correctly earn 15 points!`;
  } else {
    resultMessage = `The group voted for **${votedOutName}** — but they were innocent!\n` +
      `The real spy was **${spyNames}**.\n` +
      `The civilian word was **${gameData.civilian_word}**, the spy had **${gameData.spy_word}**.\n` +
      `The spy earns 20 points for surviving!`;
  }

  const voteBreakdown = Object.entries(votes)
    .sort((a, b) => b[1] - a[1])
    .map(([uid, count]) => {
      const name = playerMap[parseInt(uid)]
        ? (playerMap[parseInt(uid)].display_name || playerMap[parseInt(uid)].username)
        : `Player ${uid}`;
      return `${name}: ${count} vote${count !== 1 ? 's' : ''}`;
    }).join('\n');

  const notifications = [{
    channel: 'channel',
    type: 'game_result',
    message: `${resultMessage}\n\n**Vote Breakdown:**\n${voteBreakdown}`,
  }];

  return {
    complete: true,
    playerUpdates,
    gameData: {
      voted_out: votedOut,
      spy_caught: spyCaught,
      votes,
      result_message: resultMessage,
    },
    notifications,
  };
}

function formatClueReveal(clues, players, round) {
  const playerMap = {};
  for (const p of players) playerMap[p.user_id] = p;

  const lines = clues.map(c => {
    const name = playerMap[c.user_id]
      ? (playerMap[c.user_id].display_name || playerMap[c.user_id].username)
      : `Player ${c.user_id}`;
    return `**${name}**: "${c.clue}"`;
  });

  return `**Round ${round} Clues:**\n${lines.join('\n')}`;
}

// ─── PLUGIN REGISTRY ───────────────────────────────────────
export function getPlugin(key) {
  const plugin = plugins[key];
  if (!plugin) throw new Error(`No plugin for game type: ${key}`);
  return plugin;
}

export function listPlugins() {
  return Object.keys(plugins);
}
