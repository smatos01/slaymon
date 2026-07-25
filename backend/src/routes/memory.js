const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { regenerateCredits, MAX_CREDITS } = require('../utils/credits');
const { generateShuffledBoard } = require('../utils/memoryData');

const router = express.Router();
const JWT_SECRET = 'your-secret-key-change-this';

const MAX_CREDITS_TO_PLAY = 7;
const BOARD_SIZE = 16;

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 50% chance +2, 40% chance +3, 10% chance +5
function rollCreditsWon() {
  const r = Math.random() * 100;
  if (r <= 50) return 2;
  if (r <= 90) return 3;
  return 5;
}

// 50% chance +1 gem, guaranteed on Sundays
function rollGemsWon(isSunday) {
  if (isSunday) return 1;
  return Math.random() < 0.5 ? 1 : 0;
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
  db.get(
    `SELECT credits, credit_timer_timestamp, gems, last_memory_date FROM users WHERE id = ?`,
    [req.userId],
    (err, user) => {
      if (err || !user) return res.status(404).json({ error: 'User not found' });

      const now = Math.floor(Date.now() / 1000);
      const regen = regenerateCredits(user.credits, user.credit_timer_timestamp, now);

      const sendResponse = () => {
        const today = getTodayDateString();
        const isSunday = new Date().getDay() === 0;
        const alreadyPlayedToday = user.last_memory_date === today;
        const tooManyCredits = regen.credits > MAX_CREDITS_TO_PLAY;

        db.get(
          `SELECT id, board, matched, first_flip FROM memory_games WHERE user_id = ? AND completed_at IS NULL`,
          [req.userId],
          (err, activeGame) => {
            // Only ever reveal images for slots the player has already legitimately
            // seen (matched pairs + a pending first flip) — never the untouched board.
            let matchedRevealed = null;
            let firstFlipRevealed = null;
            if (activeGame) {
              const board = JSON.parse(activeGame.board);
              const matched = JSON.parse(activeGame.matched);
              matchedRevealed = matched.map(position => ({ position, image: board[position] }));
              if (activeGame.first_flip !== null && activeGame.first_flip !== undefined) {
                firstFlipRevealed = { position: activeGame.first_flip, image: board[activeGame.first_flip] };
              }
            }

            res.json({
              canPlay: !alreadyPlayedToday && !tooManyCredits && !activeGame,
              alreadyPlayedToday,
              tooManyCredits,
              hasActiveGame: !!activeGame,
              matchedRevealed,
              firstFlipRevealed,
              credits: regen.credits,
              gems: user.gems,
              maxCreditsToPlay: MAX_CREDITS_TO_PLAY,
              isSunday
            });
          }
        );
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
    }
  );
});

router.post('/start', verifyToken, (req, res) => {
  db.get(
    `SELECT credits, credit_timer_timestamp, last_memory_date FROM users WHERE id = ?`,
    [req.userId],
    (err, user) => {
      if (err || !user) return res.status(404).json({ error: 'User not found' });

      const now = Math.floor(Date.now() / 1000);
      const today = getTodayDateString();
      const regen = regenerateCredits(user.credits, user.credit_timer_timestamp, now);

      if (regen.changed) {
        db.run(
          `UPDATE users SET credits = ?, credit_timer_timestamp = ? WHERE id = ?`,
          [regen.credits, regen.timerTimestamp, req.userId]
        );
      }

      if (user.last_memory_date === today) {
        return res.status(400).json({ error: 'You already played the memory game today. Come back tomorrow!' });
      }

      if (regen.credits > MAX_CREDITS_TO_PLAY) {
        return res.status(400).json({
          error: `You have ${regen.credits}/12 credits. You need ${MAX_CREDITS_TO_PLAY} or fewer to play, since you could win up to 5 more.`
        });
      }

      db.get(
        `SELECT id FROM memory_games WHERE user_id = ? AND completed_at IS NULL`,
        [req.userId],
        (err, activeGame) => {
          if (activeGame) {
            return res.status(400).json({ error: 'You already have an active game in progress. Complete it first!' });
          }

          const board = generateShuffledBoard();

          db.run(
            `INSERT INTO memory_games (user_id, board, matched, first_flip, game_date, timestamp)
             VALUES (?, ?, '[]', NULL, ?, ?)`,
            [req.userId, JSON.stringify(board), today, now],
            function (err) {
              if (err) return res.status(500).json({ error: 'Failed to start game' });
              res.json({ gameId: this.lastID, boardSize: board.length, message: 'Game started! Find all 8 pairs.' });
            }
          );
        }
      );
    }
  );
});

router.post('/reveal', verifyToken, (req, res) => {
  const { position } = req.body;

  if (typeof position !== 'number' || position < 0 || position >= BOARD_SIZE) {
    return res.status(400).json({ error: `Position must be between 0 and ${BOARD_SIZE - 1}` });
  }

  db.get(
    `SELECT id, board, matched, first_flip FROM memory_games WHERE user_id = ? AND completed_at IS NULL`,
    [req.userId],
    (err, game) => {
      if (err || !game) {
        return res.status(400).json({ error: 'No active game. Start a new game first!' });
      }

      const board = JSON.parse(game.board);
      const matched = JSON.parse(game.matched);

      if (matched.includes(position)) {
        return res.status(400).json({ error: 'That card is already matched' });
      }
      if (game.first_flip === position) {
        return res.status(400).json({ error: 'Pick a different card' });
      }

      const image = board[position];

      // First flip of a new pair attempt — remember it and reveal.
      if (game.first_flip === null || game.first_flip === undefined) {
        db.run(`UPDATE memory_games SET first_flip = ? WHERE id = ?`, [position, game.id]);
        return res.json({ position, image, isFirstFlip: true });
      }

      // Second flip — compare against the pending first flip.
      const firstPosition = game.first_flip;
      const firstImage = board[firstPosition];
      const isMatch = firstImage === image;

      if (!isMatch) {
        db.run(`UPDATE memory_games SET first_flip = NULL WHERE id = ?`, [game.id]);
        return res.json({ position, image, isFirstFlip: false, matched: false, firstPosition, firstImage });
      }

      const newMatched = [...matched, firstPosition, position];

      if (newMatched.length < BOARD_SIZE) {
        db.run(
          `UPDATE memory_games SET matched = ?, first_flip = NULL WHERE id = ?`,
          [JSON.stringify(newMatched), game.id]
        );
        return res.json({ position, image, isFirstFlip: false, matched: true, firstPosition, gameComplete: false });
      }

      // All 8 pairs found — roll rewards and finish the game.
      const now = Math.floor(Date.now() / 1000);
      const today = getTodayDateString();
      const isSunday = new Date().getDay() === 0;
      const creditsWon = rollCreditsWon();
      const gemsWon = rollGemsWon(isSunday);

      db.get(`SELECT credits, gems FROM users WHERE id = ?`, [req.userId], (err, user) => {
        const newCredits = Math.min(MAX_CREDITS, user.credits + creditsWon);
        const newGems = user.gems + gemsWon;

        db.run(
          `UPDATE memory_games SET matched = ?, first_flip = NULL, completed_at = ?, credits_won = ?, gems_won = ? WHERE id = ?`,
          [JSON.stringify(newMatched), now, creditsWon, gemsWon, game.id]
        );
        db.run(
          `UPDATE users SET credits = ?, gems = ?, last_memory_date = ? WHERE id = ?`,
          [newCredits, newGems, today, req.userId]
        );
        db.run(
          `INSERT INTO credits_log (user_id, change, reason, timestamp) VALUES (?, ?, 'memory_game', ?)`,
          [req.userId, creditsWon, now]
        );

        res.json({
          position,
          image,
          isFirstFlip: false,
          matched: true,
          firstPosition,
          gameComplete: true,
          creditsWon,
          gemsWon,
          newCredits,
          newGems,
          message: `You found all 8 pairs! You won ${creditsWon} credit${creditsWon > 1 ? 's' : ''}${gemsWon > 0 ? ` and ${gemsWon} gem${gemsWon > 1 ? 's' : ''}` : ''}!`
        });
      });
    }
  );
});

module.exports = router;
