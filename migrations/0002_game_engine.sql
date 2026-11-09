-- Game type definitions
CREATE TABLE IF NOT EXISTS game_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  min_players INTEGER DEFAULT 4,
  max_players INTEGER DEFAULT 12,
  is_active INTEGER DEFAULT 1,
  config TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Individual game rounds
CREATE TABLE IF NOT EXISTS game_instances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_type_id INTEGER REFERENCES game_types(id),
  season TEXT,
  status TEXT DEFAULT 'registration',
  current_phase TEXT DEFAULT 'registration',
  phase_number INTEGER DEFAULT 0,
  phase_deadline DATETIME,
  game_data TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME
);

-- Players in each game
CREATE TABLE IF NOT EXISTS game_instance_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_instance_id INTEGER REFERENCES game_instances(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  role TEXT,
  secret_data TEXT,
  status TEXT DEFAULT 'active',
  score INTEGER DEFAULT 0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_instance_id, user_id)
);

-- Player actions (clues, votes, guesses)
CREATE TABLE IF NOT EXISTS game_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_instance_id INTEGER REFERENCES game_instances(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  phase TEXT NOT NULL,
  phase_number INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  action_data TEXT NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cross-game leaderboard
CREATE TABLE IF NOT EXISTS game_leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  game_type_key TEXT NOT NULL,
  season TEXT NOT NULL,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  last_played_at DATETIME,
  UNIQUE(user_id, game_type_key, season)
);

-- Notifications queue for Cliq messages
CREATE TABLE IF NOT EXISTS game_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_instance_id INTEGER REFERENCES game_instances(id) ON DELETE CASCADE,
  user_id INTEGER,
  channel TEXT DEFAULT 'dm',
  message_type TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  send_after DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gi_status ON game_instances(status);
CREATE INDEX IF NOT EXISTS idx_gi_type ON game_instances(game_type_id);
CREATE INDEX IF NOT EXISTS idx_gi_deadline ON game_instances(status, phase_deadline);
CREATE INDEX IF NOT EXISTS idx_gip_game ON game_instance_players(game_instance_id);
CREATE INDEX IF NOT EXISTS idx_gip_user ON game_instance_players(user_id);
CREATE INDEX IF NOT EXISTS idx_ga_game_phase ON game_actions(game_instance_id, phase, phase_number);
CREATE INDEX IF NOT EXISTS idx_ga_user ON game_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_gl_season ON game_leaderboard(season, game_type_key);
CREATE INDEX IF NOT EXISTS idx_gn_status ON game_notifications(status, send_after);

-- Seed game types
INSERT OR IGNORE INTO game_types (key, name, description, min_players, max_players, config)
VALUES
  ('spy', 'Who is the Spy', 'One player gets a different word. Find the spy through clues and deduction.', 4, 12,
   '{"clue_rounds":2,"phase_hours":{"registration":48,"clue":24,"voting":12},"spy_count":1,"spy_bonus_guess":true}'),
  ('trivia', 'Team Trivia', 'Answer questions across categories. Fastest correct answer wins the most points.', 2, 50,
   '{"rounds":10,"phase_hours":{"registration":48,"question":8,"reveal":0},"categories":["general","pop_culture","science","history"]}'),
  ('word_chain', 'Word Chain', 'Each player adds a word starting with the last letter of the previous word. Theme-based rounds.', 3, 20,
   '{"rounds":5,"phase_hours":{"registration":48,"play":12},"time_per_turn_hours":4}');
