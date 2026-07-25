const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { regenerateCredits, MAX_CREDITS } = require('../utils/credits');

const router = express.Router();
const JWT_SECRET = 'your-secret-key-change-this';

const MAX_CREDITS_TO_PLAY = 7;
const MIN_NUMBER = 1;
const MAX_NUMBER = 50;

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateCreditsWon(guessCount) {
  if (guessCount <= 3) return 5;
  if (guessCount <= 5) return 3;
  if (guessCount <= 7) return 2;
  return 1;
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
    `SELECT credits, credit_timer_timestamp, gems, last_guess_date FROM users WHERE id = ?`,
    [req.userId],
    (err, user) => {
      if (err || !user) return res.status(404).json({ error: 'User not found' });

      const now = Math.floor(Date.now() / 1000);
      const regen = regenerateCredits(user.credits, user.credit_timer_timestamp, now);

      const sendResponse = () => {
        const today = getTodayDateString();
        const isSunday = new Date().getDay() === 0;
        const alreadyPlayedToday = user.last_guess_date === today;
        const tooManyCredits = regen.credits > MAX_CREDITS_TO_PLAY;

        // Check if there's an active game
        db.get(
          `SELECT id, target_number, guess_count FROM number_guess_games WHERE user_id = ? AND completed_at IS NULL`,
          [req.userId],
          (err, activeGame) => {
            res.json({
              canPlay: !alreadyPlayedToday && !tooManyCredits && !activeGame,
              alreadyPlayedToday,
              tooManyCredits,
              hasActiveGame: !!activeGame,
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
    `SELECT credits, credit_timer_timestamp, last_guess_date FROM users WHERE id = ?`,
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

      if (user.last_guess_date === today) {
        return res.status(400).json({ error: 'You already played the number guessing game today. Come back tomorrow!' });
      }

      if (regen.credits > MAX_CREDITS_TO_PLAY) {
        return res.status(400).json({
          error: `You have ${regen.credits}/12 credits. You need ${MAX_CREDITS_TO_PLAY} or fewer to play, since you could win up to 5 more.`
        });
      }

      // Check for active game
      db.get(
        `SELECT id FROM number_guess_games WHERE user_id = ? AND completed_at IS NULL`,
        [req.userId],
        (err, activeGame) => {
          if (activeGame) {
            return res.status(400).json({ error: 'You already have an active game in progress. Complete it first!' });
          }

          // Generate random number
          const targetNumber = Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER;

          db.run(
            `INSERT INTO number_guess_games (user_id, target_number, guess_count, game_date, timestamp)
             VALUES (?, ?, 0, ?, ?)`,
            [req.userId, targetNumber, today, now],
            function(err) {
              if (err) return res.status(500).json({ error: 'Failed to start game' });
              res.json({ gameId: this.lastID, message: 'Game started! Guess a number between 1 and 50.' });
            }
          );
        }
      );
    }
  );
});

router.post('/guess', verifyToken, (req, res) => {
  const { guessNumber } = req.body;

  if (typeof guessNumber !== 'number' || guessNumber < MIN_NUMBER || guessNumber > MAX_NUMBER) {
    return res.status(400).json({ error: `Please enter a number between ${MIN_NUMBER} and ${MAX_NUMBER}` });
  }

  db.get(
    `SELECT id, target_number, guess_count FROM number_guess_games WHERE user_id = ? AND completed_at IS NULL`,
    [req.userId],
    (err, game) => {
      if (err || !game) {
        return res.status(400).json({ error: 'No active game. Start a new game first!' });
      }

      const now = Math.floor(Date.now() / 1000);
      const newGuessCount = game.guess_count + 1;
      const isCorrect = guessNumber === game.target_number;

      // Log the guess
      db.run(
        `INSERT INTO number_guess_log (user_id, guess_number, guess_count, is_correct, timestamp)
         VALUES (?, ?, ?, ?, ?)`,
        [req.userId, guessNumber, newGuessCount, isCorrect ? 1 : 0, now]
      );

      if (isCorrect) {
        // Game won! Calculate rewards
        const creditsWon = calculateCreditsWon(newGuessCount);
        const isSunday = new Date().getDay() === 0;
        const gemsWon = isSunday ? 1 : (Math.random() < 0.5 ? 1 : 0);
        const today = getTodayDateString();

        db.get(
          `SELECT credits, gems FROM users WHERE id = ?`,
          [req.userId],
          (err, user) => {
            const newCredits = Math.min(MAX_CREDITS, user.credits + creditsWon);
            const newGems = user.gems + gemsWon;

            db.run(
              `UPDATE number_guess_games SET completed_at = ?, credits_won = ?, gems_won = ? WHERE id = ?`,
              [now, creditsWon, gemsWon, game.id]
            );

            db.run(
              `UPDATE users SET credits = ?, gems = ?, last_guess_date = ? WHERE id = ?`,
              [newCredits, newGems, today, req.userId]
            );

            db.run(
              `INSERT INTO credits_log (user_id, change, reason, timestamp) VALUES (?, ?, 'number_guess', ?)`,
              [req.userId, creditsWon, now]
            );

            res.json({
              correct: true,
              targetNumber: game.target_number,
              guessCount: newGuessCount,
              creditsWon,
              gemsWon,
              newCredits,
              newGems,
              message: `Correct! You won ${creditsWon} credit${creditsWon > 1 ? 's' : ''}${gemsWon > 0 ? ` and ${gemsWon} gem${gemsWon > 1 ? 's' : ''}` : ''}!`
            });
          }
        );
      } else {
        // Game continues
        const feedback = guessNumber < game.target_number ? 'higher' : 'lower';

        db.run(
          `UPDATE number_guess_games SET guess_count = ? WHERE id = ?`,
          [newGuessCount, game.id]
        );

        res.json({
          correct: false,
          feedback,
          guessCount: newGuessCount,
          message: `The number is ${feedback}. Guess again!`
        });
      }
    }
  );
});

module.exports = router;
