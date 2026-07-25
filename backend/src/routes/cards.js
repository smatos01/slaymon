const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/all', (req, res) => {
  db.all(`SELECT * FROM cards ORDER BY id`, (err, cards) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(cards);
  });
});

router.get('/:id', (req, res) => {
  db.get(`SELECT * FROM cards WHERE id = ?`, [req.params.id], (err, card) => {
    if (err || !card) return res.status(404).json({ error: 'Card not found' });
    res.json(card);
  });
});

module.exports = router;
