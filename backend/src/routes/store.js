const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const JWT_SECRET = 'your-secret-key-change-this';

// rarity: 1=common, 2=uncommon, 3=rare, 4=epic
const RARITY_COST = { 1: 1, 2: 5, 3: 10, 4: 20 };

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

function dbGet(sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function dbRun(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      err ? reject(err) : resolve(this);
    });
  });
}

router.post('/buy/:cardId', verifyToken, async (req, res) => {
  const cardId = parseInt(req.params.cardId, 10);
  if (isNaN(cardId)) return res.status(400).json({ error: 'Invalid card' });

  try {
    const card = await dbGet(`SELECT id, rarity FROM cards WHERE id = ?`, [cardId]);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const cost = RARITY_COST[card.rarity];
    if (!cost) return res.status(500).json({ error: 'Card has no valid rarity' });

    const user = await dbGet(`SELECT gems FROM users WHERE id = ?`, [req.userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.gems < cost) {
      return res.status(400).json({ error: `Not enough gems. This card costs ${cost} 💜.` });
    }

    const newGems = user.gems - cost;
    const now = Math.floor(Date.now() / 1000);

    const existing = await dbGet(
      `SELECT quantity FROM user_cards WHERE user_id = ? AND card_id = ?`,
      [req.userId, cardId]
    );
    const newQuantity = (existing?.quantity || 0) + 1;

    if (existing) {
      await dbRun(
        `UPDATE user_cards SET quantity = quantity + 1 WHERE user_id = ? AND card_id = ?`,
        [req.userId, cardId]
      );
    } else {
      await dbRun(
        `INSERT INTO user_cards (user_id, card_id, quantity) VALUES (?, ?, 1)`,
        [req.userId, cardId]
      );
    }

    await dbRun(`UPDATE users SET gems = ? WHERE id = ?`, [newGems, req.userId]);
    await dbRun(
      `INSERT INTO purchases_log (user_id, card_id, gems_spent, timestamp) VALUES (?, ?, ?, ?)`,
      [req.userId, cardId, cost, now]
    );

    res.json({ success: true, newGems, newQuantity, cost });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
