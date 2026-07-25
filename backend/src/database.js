const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'slaymon.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    credits INTEGER DEFAULT 12,
    credit_timer_timestamp INTEGER,
    total_cards INTEGER DEFAULT 0,
    last_spin_date TEXT,
    gems INTEGER DEFAULT 5,
    created_at INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    rarity INTEGER,
    hp INTEGER,
    image_file TEXT,
    special_card TEXT,
    move1_name TEXT,
    move1_damage TEXT,
    move2_name TEXT,
    move2_damage TEXT,
    ability TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(card_id) REFERENCES cards(id),
    UNIQUE(user_id, card_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS draws_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    timestamp INTEGER,
    is_new_card BOOLEAN,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(card_id) REFERENCES cards(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS credits_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    change INTEGER,
    reason TEXT,
    timestamp INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS spins_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    segment_index INTEGER,
    credits_won INTEGER,
    gems_won INTEGER,
    spin_date TEXT,
    timestamp INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS number_guess_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_number INTEGER NOT NULL,
    guess_count INTEGER DEFAULT 0,
    completed_at INTEGER,
    credits_won INTEGER,
    gems_won INTEGER,
    game_date TEXT,
    timestamp INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS number_guess_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    guess_number INTEGER,
    guess_count INTEGER,
    is_correct BOOLEAN,
    timestamp INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS post_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at INTEGER,
    FOREIGN KEY(post_id) REFERENCES posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(post_id, user_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS post_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER,
    FOREIGN KEY(post_id) REFERENCES posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Append-only, so an unlike doesn't erase the fact a "like a post" mission was ever completed
  db.run(`CREATE TABLE IF NOT EXISTS social_action_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    timestamp INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS mission_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mission_id TEXT NOT NULL,
    claimed_at INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, mission_id)
  )`);

  // One row per user per calendar day they were active (see user.js /profile and
  // auth.js /login) — powers the "login on N different days" missions.
  db.run(`CREATE TABLE IF NOT EXISTS login_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    login_date TEXT NOT NULL,
    timestamp INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, login_date)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS purchases_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    gems_spent INTEGER,
    timestamp INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(card_id) REFERENCES cards(id)
  )`);

  // One active/completed Memory game per user at a time. `board` is the shuffled
  // 16-slot layout (JSON array of image keys), `matched` the JSON array of matched
  // slot indices, `first_flip` the pending first-flipped slot of the current pair
  // attempt (null when no flip is pending) — see routes/memory.js.
  db.run(`CREATE TABLE IF NOT EXISTS memory_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    board TEXT NOT NULL,
    matched TEXT DEFAULT '[]',
    first_flip INTEGER,
    completed_at INTEGER,
    credits_won INTEGER,
    gems_won INTEGER,
    game_date TEXT,
    timestamp INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Safe migrations for databases created before these columns existed
  db.run(`ALTER TABLE users ADD COLUMN last_spin_date TEXT`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN gems INTEGER DEFAULT 5`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN last_guess_date TEXT`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN last_memory_date TEXT`, () => {});
  db.run(`ALTER TABLE spins_log ADD COLUMN gems_won INTEGER`, () => {});
  db.run(`UPDATE users SET gems = 5 WHERE gems IS NULL`, () => {});
});

module.exports = db;
