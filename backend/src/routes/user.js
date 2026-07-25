const express = require('express');
const db = require('../database');
const { cardsData } = require('../utils/cardData');
const { regenerateCredits } = require('../utils/credits');

const router = express.Router();

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Tokens persist indefinitely client-side (no re-login most days), so the daily
// "login" signal these missions need actually comes from opening the app, not
// from POST /api/auth/login. Idempotent via the login_log UNIQUE constraint.
function logLoginDay(userId) {
  const today = getTodayDateString();
  const now = Math.floor(Date.now() / 1000);
  db.run(
    `INSERT OR IGNORE INTO login_log (user_id, login_date, timestamp) VALUES (?, ?, ?)`,
    [userId, today, now]
  );
}

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = require('jsonwebtoken').verify(token, 'your-secret-key-change-this');
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.get('/profile', verifyToken, (req, res) => {
  db.get(`SELECT username, credits, credit_timer_timestamp, gems FROM users WHERE id = ?`, [req.userId], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });

    logLoginDay(req.userId);

    const now = Math.floor(Date.now() / 1000);
    const regen = regenerateCredits(user.credits, user.credit_timer_timestamp, now);

    const sendResponse = () => {
      let minutesUntilNextCredit = 0;
      if (regen.credits < 12 && regen.timerTimestamp) {
        const secondsRemaining = regen.timerTimestamp - now;
        minutesUntilNextCredit = Math.max(0, Math.ceil(secondsRemaining / 60));
      }

      const isSunday = new Date().getDay() === 0;

      res.json({
        username: user.username,
        credits: regen.credits,
        gems: user.gems,
        minutesUntilNextCredit,
        isSunday
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

router.get('/collection', verifyToken, (req, res) => {
  db.all(
    `SELECT c.id, c.name, c.image_file, c.rarity, c.type, uc.quantity
     FROM cards c
     LEFT JOIN user_cards uc ON c.id = uc.card_id AND uc.user_id = ?
     ORDER BY c.id`,
    [req.userId],
    (err, cards) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(cards.map(c => ({
        ...c,
        quantity: c.quantity || 0
      })));
    }
  );
});

router.post('/draw', verifyToken, (req, res) => {
  db.get(`SELECT credits, credit_timer_timestamp FROM users WHERE id = ?`, [req.userId], (err, user) => {
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = Math.floor(Date.now() / 1000);

    // Step 1: Catch up any credits earned from the timer BEFORE checking
    // if the user has enough to draw — otherwise a user stuck at 0 credits
    // would never have their earned credit applied.
    const regen = regenerateCredits(user.credits, user.credit_timer_timestamp, now);
    const credits = regen.credits;
    const timerTimestamp = regen.timerTimestamp;

    if (credits < 1) {
      if (regen.changed) {
        db.run(
          `UPDATE users SET credits = ?, credit_timer_timestamp = ? WHERE id = ?`,
          [credits, timerTimestamp, req.userId]
        );
      }
      return res.status(400).json({ error: 'Not enough credits' });
    }

    // Step 2: Draw the card (deduct 1 credit)
    const newCredits = credits - 1;

    // Step 3: Update timer ONLY if the user had 12 credits right before this draw
    // (not if they just earned one from timer expiring)
    const wasAt12Credits = credits === 12;
    const newTimerTimestamp = wasAt12Credits ? now + 3600 : timerTimestamp;

    // Draw card logic
    const isSunday = new Date().getDay() === 0;
    let availableCards = cardsData;

    if (!isSunday) {
      availableCards = cardsData.filter(c => c.special === null);
    }

    const rand = Math.random() * 100;
    let rarity;
    if (rand <= 55) rarity = 1;
    else if (rand <= 83) rarity = 2;
    else if (rand <= 96) rarity = 3;
    else rarity = 4;

    const rarityCards = availableCards.filter(c => c.rarity === rarity);
    const card = rarityCards[Math.floor(Math.random() * rarityCards.length)];

    if (!card) {
      return res.status(500).json({ error: 'No cards available' });
    }

    db.get(
      `SELECT quantity FROM user_cards WHERE user_id = ? AND card_id = ?`,
      [req.userId, card.id],
      (err, existing) => {
        const isNewCard = !existing;

        if (isNewCard) {
          db.run(
            `INSERT INTO user_cards (user_id, card_id, quantity) VALUES (?, ?, 1)`,
            [req.userId, card.id]
          );
        } else {
          db.run(
            `UPDATE user_cards SET quantity = quantity + 1 WHERE user_id = ? AND card_id = ?`,
            [req.userId, card.id]
          );
        }

        db.run(
          `INSERT INTO draws_log (user_id, card_id, timestamp, is_new_card) VALUES (?, ?, ?, ?)`,
          [req.userId, card.id, now, isNewCard ? 1 : 0]
        );

        db.run(
          `UPDATE users SET credits = ?, credit_timer_timestamp = ? WHERE id = ?`,
          [newCredits, newTimerTimestamp, req.userId]
        );

        db.run(
          `INSERT INTO credits_log (user_id, change, reason, timestamp)
           VALUES (?, ?, 'card_draw', ?)`,
          [req.userId, -1, now]
        );

        const quantity = (existing?.quantity || 0) + 1;

        res.json({
          card: { ...card, quantity },
          isNewCard
        });
      }
    );
  });
});

module.exports = router;
