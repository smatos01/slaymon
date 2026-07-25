const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  db.all(
    `SELECT u.username,
            COUNT(DISTINCT CASE WHEN uc.quantity > 0 THEN uc.card_id END) as total_cards,
            SUM(CASE WHEN c.rarity = 1 THEN 1 ELSE 0 END) as rarity_1,
            SUM(CASE WHEN c.rarity = 2 THEN 1 ELSE 0 END) as rarity_2,
            SUM(CASE WHEN c.rarity = 3 THEN 1 ELSE 0 END) as rarity_3,
            SUM(CASE WHEN c.rarity = 4 THEN 1 ELSE 0 END) as rarity_4
     FROM users u
     LEFT JOIN user_cards uc ON u.id = uc.user_id
     LEFT JOIN cards c ON uc.card_id = c.id
     GROUP BY u.id
     ORDER BY total_cards DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows || []);
    }
  );
});

module.exports = router;
