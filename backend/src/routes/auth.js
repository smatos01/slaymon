const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const JWT_SECRET = 'your-secret-key-change-this';

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function logLoginDay(userId) {
  const today = getTodayDateString();
  const now = Math.floor(Date.now() / 1000);
  db.run(
    `INSERT OR IGNORE INTO login_log (user_id, login_date, timestamp) VALUES (?, ?, ?)`,
    [userId, today, now]
  );
}

router.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const now = Math.floor(Date.now() / 1000);

  db.run(
    `INSERT INTO users (username, password, credits, credit_timer_timestamp, created_at)
     VALUES (?, ?, 12, ?, ?)`,
    [username, hashedPassword, 0, now],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      logLoginDay(this.lastID);
      const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET);
      res.json({ token, userId: this.lastID, username });
    }
  );
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    logLoginDay(user.id);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, userId: user.id, username: user.username });
  });
});

module.exports = router;
