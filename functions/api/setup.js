// Setup/migration endpoint - creates tables and seeds data
// This is a public endpoint used for local development setup
// In production, use wrangler d1 migrations

export async function onRequestPost(context) {
  const { env } = context;

  try {
    // Create tables
    const statements = [
      `CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, description TEXT)`,
      `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT, display_name TEXT NOT NULL, role_id INTEGER REFERENCES roles(id), is_admin INTEGER DEFAULT 0, google_sub TEXT UNIQUE, is_active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_login DATETIME)`,
      `CREATE TABLE IF NOT EXISTS apps (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, url TEXT NOT NULL, description TEXT, icon TEXT, sort_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS app_roles (app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE, role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE, PRIMARY KEY (app_id, role_id))`,
      `CREATE TABLE IF NOT EXISTS user_app_prefs (user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE, open_new_tab INTEGER DEFAULT 1, PRIMARY KEY (user_id, app_id))`,
      `CREATE TABLE IF NOT EXISTS game_plays (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id), game_key TEXT NOT NULL, score INTEGER NOT NULL, accuracy REAL, grade TEXT, played_at DATETIME DEFAULT CURRENT_TIMESTAMP, play_date DATE NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS achievements (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT, icon TEXT, category TEXT)`,
      `CREATE TABLE IF NOT EXISTS user_achievements (user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE, earned_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (user_id, achievement_id))`,
      `CREATE TABLE IF NOT EXISTS login_streaks (user_id INTEGER PRIMARY KEY REFERENCES users(id), current_streak INTEGER DEFAULT 0, longest_streak INTEGER DEFAULT 0, last_login_date DATE)`,
      `CREATE TABLE IF NOT EXISTS app_launches (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id), app_id INTEGER REFERENCES apps(id), launched_at DATETIME DEFAULT CURRENT_TIMESTAMP, launch_date DATE NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, description TEXT)`,
      `CREATE TABLE IF NOT EXISTS password_reset_tokens (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, token TEXT UNIQUE NOT NULL, expires_at DATETIME NOT NULL, used INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE INDEX IF NOT EXISTS idx_game_plays_user_date ON game_plays(user_id, play_date)`,
      `CREATE INDEX IF NOT EXISTS idx_game_plays_user_game ON game_plays(user_id, game_key)`,
      `CREATE INDEX IF NOT EXISTS idx_app_launches_user_date ON app_launches(user_id, launch_date)`,
      `CREATE INDEX IF NOT EXISTS idx_app_launches_user_app ON app_launches(user_id, app_id)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub)`,
      // Game engine tables
      `CREATE TABLE IF NOT EXISTS game_types (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT, min_players INTEGER DEFAULT 4, max_players INTEGER DEFAULT 12, is_active INTEGER DEFAULT 1, config TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS game_instances (id INTEGER PRIMARY KEY AUTOINCREMENT, game_type_id INTEGER REFERENCES game_types(id), season TEXT, status TEXT DEFAULT 'registration', current_phase TEXT DEFAULT 'registration', phase_number INTEGER DEFAULT 0, phase_deadline DATETIME, game_data TEXT, created_by INTEGER REFERENCES users(id), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, started_at DATETIME, completed_at DATETIME)`,
      `CREATE TABLE IF NOT EXISTS game_instance_players (id INTEGER PRIMARY KEY AUTOINCREMENT, game_instance_id INTEGER REFERENCES game_instances(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id), role TEXT, secret_data TEXT, status TEXT DEFAULT 'active', score INTEGER DEFAULT 0, joined_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(game_instance_id, user_id))`,
      `CREATE TABLE IF NOT EXISTS game_actions (id INTEGER PRIMARY KEY AUTOINCREMENT, game_instance_id INTEGER REFERENCES game_instances(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id), phase TEXT NOT NULL, phase_number INTEGER NOT NULL, action_type TEXT NOT NULL, action_data TEXT NOT NULL, submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS game_leaderboard (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id), game_type_key TEXT NOT NULL, season TEXT NOT NULL, games_played INTEGER DEFAULT 0, games_won INTEGER DEFAULT 0, total_score INTEGER DEFAULT 0, last_played_at DATETIME, UNIQUE(user_id, game_type_key, season))`,
      `CREATE TABLE IF NOT EXISTS game_notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, game_instance_id INTEGER REFERENCES game_instances(id) ON DELETE CASCADE, user_id INTEGER, channel TEXT DEFAULT 'dm', message_type TEXT, message TEXT NOT NULL, status TEXT DEFAULT 'pending', send_after DATETIME DEFAULT CURRENT_TIMESTAMP, sent_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE INDEX IF NOT EXISTS idx_gi_status ON game_instances(status)`,
      `CREATE INDEX IF NOT EXISTS idx_gi_deadline ON game_instances(status, phase_deadline)`,
      `CREATE INDEX IF NOT EXISTS idx_gip_game ON game_instance_players(game_instance_id)`,
      `CREATE INDEX IF NOT EXISTS idx_gip_user ON game_instance_players(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_ga_game_phase ON game_actions(game_instance_id, phase, phase_number)`,
      `CREATE INDEX IF NOT EXISTS idx_gn_status ON game_notifications(status, send_after)`,
    ];

    for (const sql of statements) {
      await env.DB.prepare(sql).run();
    }

    // Seed game types
    const gameTypes = [
      ['spy', 'Who is the Spy', 'One player gets a different word. Find the spy through clues and deduction.', 4, 12, '{"clue_rounds":2,"phase_hours":{"registration":48,"clue_1":24,"clue_2":24,"voting":12},"spy_count":1}'],
      ['trivia', 'Team Trivia', 'Answer questions across categories. Fastest correct answer wins the most points.', 2, 50, '{"rounds":10,"phase_hours":{"registration":48,"question":8,"reveal":0}}'],
      ['word_chain', 'Word Chain', 'Each player adds a word starting with the last letter of the previous word.', 3, 20, '{"rounds":5,"phase_hours":{"registration":48,"play":12}}'],
    ];
    for (const [key, name, desc, minP, maxP, config] of gameTypes) {
      await env.DB.prepare('INSERT OR IGNORE INTO game_types (key, name, description, min_players, max_players, config) VALUES (?, ?, ?, ?, ?, ?)').bind(key, name, desc, minP, maxP, config).run();
    }

    // Seed data
    await env.DB.prepare(`INSERT OR IGNORE INTO settings (key, value, description) VALUES ('daily_game_limit', '2', 'Max games a user can play per day')`).run();
    await env.DB.prepare(`INSERT OR IGNORE INTO settings (key, value, description) VALUES ('game_duration_seconds', '60', 'Default max game duration in seconds')`).run();
    await env.DB.prepare(`INSERT OR IGNORE INTO settings (key, value, description) VALUES ('games_enabled', 'true', 'Master toggle for the games system')`).run();

    // Achievements
    const achievements = [
      ['first_steps', 'First Steps', 'Log in for the first time', '👋', 'Login'],
      ['regular', 'Regular', 'Log in 7 days in a row', '📅', 'Login'],
      ['dedicated', 'Dedicated', 'Log in 30 days in a row', '🏆', 'Login'],
      ['early_bird', 'Early Bird', 'Log in before 7:00 AM', '🌅', 'Login'],
      ['night_owl', 'Night Owl', 'Log in after 9:00 PM', '🦉', 'Login'],
      ['first_game', 'First Game', 'Play your first mini-game', '🎮', 'Games'],
      ['high_score', 'High Score', 'Score 200+ in any game', '⭐', 'Games'],
      ['s_rank', 'S-Rank', 'Score 500+ in any game', '💎', 'Games'],
      ['sharpshooter', 'Sharpshooter', '100% accuracy in any game', '🎯', 'Games'],
      ['combo_king', 'Combo King', 'Achieve a 5x combo in any game', '🔥', 'Games'],
      ['well_rounded', 'Well Rounded', 'Play all 5 different games', '🎲', 'Games'],
      ['daily_double', 'Daily Double', 'Use both daily plays in one day', '✌️', 'Games'],
      ['five_day_player', 'Five-Day Player', 'Play games on 5 different days', '📆', 'Games'],
      ['explorer', 'Explorer', 'Launch 5 different apps in one day', '🧭', 'Dashboard'],
      ['navigator', 'Navigator', 'Launch every app assigned to your role', '🗺️', 'Dashboard'],
      ['creature_of_habit', 'Creature of Habit', 'Launch the same app 10 days in a row', '🔁', 'Dashboard'],
    ];
    for (const [key, name, desc, icon, cat] of achievements) {
      await env.DB.prepare('INSERT OR IGNORE INTO achievements (key, name, description, icon, category) VALUES (?, ?, ?, ?, ?)').bind(key, name, desc, icon, cat).run();
    }

    // Roles
    const roles = [
      ['All', 'Access to all applications'],
      ['Warehouse', 'Warehouse and inventory team'],
      ['Support', 'Customer support team'],
      ['HR', 'Human resources team'],
      ['Shifts', 'Shift workers'],
    ];
    for (const [name, desc] of roles) {
      await env.DB.prepare('INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)').bind(name, desc).run();
    }

    // Admin user (password: admin123)
    await env.DB.prepare(
      `INSERT OR IGNORE INTO users (username, email, password_hash, display_name, role_id, is_admin) VALUES ('admin', 'admin@company.com', '$2a$10$rQEY0tEMO9QmEGarGMUJR.0v.LqoKvnNkOGH4cD/L0EL8hBMi6Dci', 'Admin User', 1, 1)`
    ).run();

    // Sample apps
    const apps = [
      ['Inventory Manager', 'https://inventory.company.com', 'Manage warehouse inventory and stock levels', '📦', 1],
      ['Help Desk', 'https://helpdesk.company.com', 'Customer support ticket system', '🎫', 2],
      ['Time Tracker', 'https://time.company.com', 'Log work hours and manage timesheets', '⏰', 3],
      ['HR Portal', 'https://hr.company.com', 'Employee information and benefits', '👥', 4],
      ['Shift Planner', 'https://shifts.company.com', 'View and manage shift schedules', '📋', 5],
      ['Reports', 'https://reports.company.com', 'Business reports and analytics', '📊', 6],
      ['Team Chat', 'https://chat.company.com', 'Internal messaging and collaboration', '💬', 7],
      ['Knowledge Base', 'https://wiki.company.com', 'Internal documentation and guides', '📚', 8],
    ];
    for (const [name, url, desc, icon, order] of apps) {
      await env.DB.prepare('INSERT OR IGNORE INTO apps (name, url, description, icon, sort_order) VALUES (?, ?, ?, ?, ?)').bind(name, url, desc, icon, order).run();
    }

    // App-role assignments
    const appRoles = [
      [1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],
      [1,2],[3,2],[7,2],
      [2,3],[3,3],[7,3],[8,3],
      [4,4],[3,4],[7,4],
      [5,5],[3,5],[7,5],
    ];
    for (const [appId, roleId] of appRoles) {
      await env.DB.prepare('INSERT OR IGNORE INTO app_roles (app_id, role_id) VALUES (?, ?)').bind(appId, roleId).run();
    }

    return new Response(JSON.stringify({ success: true, message: 'Database setup complete!' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
