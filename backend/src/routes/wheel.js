const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { regenerateCredits, MAX_CREDITS } = require('../utils/credits');

const router = express.Router();
const JWT_SECRET = 'your-secret-key-change-this';

const MAX_CREDITS_TO_SPIN = 7;

// 10 equal-probability segments: alternating "no win" and a reward.
// 3 reward segments give credits (+1, +3, +5), 2 give gems.
// Gem rewards are boosted on Sundays.
function getSegments(isSunday) {
  const gemLow = isSunday ? 3 : 1;
  const gemHigh = isSunday ? 6 : 2;

  return [
    { type: 'none', label: 'No Win', creditValue: 0, gemValue: 0 },
    { type: 'credit', label: '+1🪙', creditValue: 1, gemValue: 0 },
    { type: 'none', label: 'No Win', creditValue: 0, gemValue: 0 },
    { type: 'credit', label: '+3🪙', creditValue: 3, gemValue: 0 },
    { type: 'none', label: 'No Win', creditValue: 0, gemValue: 0 },
    { type: 'credit', label: '+5🪙', creditValue: 5, gemValue: 0 },
    { type: 'none', label: 'No Win', creditValue: 0, gemValue: 0 },
    { type: 'gem', label: `+${gemLow} 💎`, creditValue: 0, gemValue: gemLow },
    { type: 'none', label: 'No Win', creditValue: 0, gemValue: 0 },
    { type: 'gem', label: `+${gemHigh} 💎`, creditValue: 0, gemValue: gemHigh }
  ];
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.get('/status', verifyToken, (req, res) => {
  db.get(`SELECT credits, credit_timer_timestamp, gems, last_spin_date FROM users WHERE id = ?`, [req.userId], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });

    const now = Math.floor(Date.now() / 1000);
    const regen = regenerateCredits(user.credits, user.credit_timer_timestamp, now);

    const sendResponse = () => {
      const today = getTodayDateString();
      const isSunday = new Date().getDay() === 0;
      const alreadySpunToday = user.last_spin_date === today;
      const tooManyCredits = regen.credits > MAX_CREDITS_TO_SPIN;

      res.json({
        canSpin: !alreadySpunToday && !tooManyCredits,
        alreadySpunToday,
        tooManyCredits,
        credits: regen.credits,
        gems: user.gems,
        maxCreditsToSpin: MAX_CREDITS_TO_SPIN,
        isSunday,
        segments: getSegments(isSunday).map(s => ({ type: s.type, label: s.label }))
      });
    };

    if (regen.changed) {
      db.run(
        `UPDATE users SET credits = ?, credit_timer_timestamp = ? WHERE id = ?`,
        [regen.credits, regen.timerTimestamp, req.userId],
        sendResponse
      );
    } else {
      sendResponse();
    }
  });
});

router.post('/spin', verifyToken, (req, res) => {
  db.get(`SELECT credits, credit_timer_timestamp, gems, last_spin_date FROM users WHERE id = ?`, [req.userId], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });

    const now = Math.floor(Date.now() / 1000);
    const today = getTodayDateString();

    if (user.last_spin_date === today) {
      return res.status(400).json({ error: 'You already spun the wheel today. Come back tomorrow!' });
    }

    const regen = regenerateCredits(user.credits, user.credit_timer_timestamp, now);
    const credits = regen.credits;

    if (credits > MAX_CREDITS_TO_SPIN) {
      if (regen.changed) {
        db.run(
          `UPDATE users SET credits = ?, credit_timer_timestamp = ? WHERE id = ?`,
          [regen.credits, regen.timerTimestamp, req.userId]
        );
      }
      return res.status(400).json({
        error: `You have too many credits to spin right now. Use some credits until you have ${MAX_CREDITS_TO_SPIN} or fewer, since you could win up to 5 more.`
      });
    }

    const isSunday = new Date().getDay() === 0;
    const segments = getSegments(isSunday);
    const segmentIndex = Math.floor(Math.random() * segments.length);
    const segment = segments[segmentIndex];

    const creditsWon = segment.creditValue;
    const gemsWon = segment.gemValue;
    const newCredits = Math.min(MAX_CREDITS, credits + creditsWon);
    const newGems = user.gems + gemsWon;

    db.run(
      `UPDATE users SET credits = ?, credit_timer_timestamp = ?, gems = ?, last_spin_date = ? WHERE id = ?`,
      [newCredits, regen.timerTimestamp, newGems, today, req.userId]
    );

    db.run(
      `INSERT INTO spins_log (user_id, segment_index, credits_won, gems_won, spin_date, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      [req.userId, segmentIndex, creditsWon, gemsWon, today, now]
    );

    if (creditsWon > 0) {
      db.run(
        `INSERT INTO credits_log (user_id, change, reason, timestamp) VALUES (?, ?, 'wheel_spin', ?)`,
        [req.userId, creditsWon, now]
      );
    }

    res.json({
      segmentIndex,
      creditsWon,
      gemsWon,
      newCredits,
      newGems
    });
  });
});

module.exports = router;
