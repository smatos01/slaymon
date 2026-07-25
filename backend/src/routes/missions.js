const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { regenerateCredits, MAX_CREDITS } = require('../utils/credits');
const { missions } = require('../utils/missionsData');

const router = express.Router();
const JWT_SECRET = 'your-secret-key-change-this';

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

function dbAll(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

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

async function getMissionProgress(userId) {
  const cardRows = await dbAll(
    `SELECT c.rarity, c.type, c.special_card, c.ability
     FROM user_cards uc JOIN cards c ON uc.card_id = c.id
     WHERE uc.user_id = ? AND uc.quantity > 0`,
    [userId]
  );

  const byRarity = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const byType = {};
  let total = 0;
  let promoCount = 0;
  let abilityCount = 0;

  cardRows.forEach(c => {
    total += 1;
    byRarity[c.rarity] = (byRarity[c.rarity] || 0) + 1;
    byType[c.type] = (byType[c.type] || 0) + 1;
    if (c.special_card === 'Promo.png') promoCount += 1;
    if (c.ability) abilityCount += 1;
  });

  const [hasPosted, hasLiked, hasCommented] = await Promise.all([
    dbGet(`SELECT 1 FROM social_action_log WHERE user_id = ? AND action = 'post' LIMIT 1`, [userId]),
    dbGet(`SELECT 1 FROM social_action_log WHERE user_id = ? AND action = 'like' LIMIT 1`, [userId]),
    dbGet(`SELECT 1 FROM social_action_log WHERE user_id = ? AND action = 'comment' LIMIT 1`, [userId])
  ]);

  const loginRow = await dbGet(
    `SELECT COUNT(DISTINCT login_date) as cnt FROM login_log WHERE user_id = ?`,
    [userId]
  );

  const wheelRow = await dbGet(
    `SELECT COUNT(*) as total, COUNT(DISTINCT spin_date) as days FROM spins_log WHERE user_id = ?`,
    [userId]
  );

  const guessRow = await dbGet(
    `SELECT COUNT(*) as total, COUNT(DISTINCT game_date) as days FROM number_guess_games WHERE user_id = ? AND completed_at IS NOT NULL`,
    [userId]
  );

  return {
    total,
    byRarity,
    byType,
    promoCount,
    abilityCount,
    loginDays: loginRow.cnt,
    wheel: { total: wheelRow.total, days: wheelRow.days },
    guess: { total: guessRow.total, days: guessRow.days },
    actions: { post: !!hasPosted, like: !!hasLiked, comment: !!hasCommented }
  };
}

function numericState(have, target) {
  return { current: Math.min(have, target), target, completed: have >= target };
}

function computeMissionState(mission, progress) {
  switch (mission.type) {
    case 'unique_total':
      return numericState(progress.total, mission.target);
    case 'unique_rarity':
      return numericState(progress.byRarity[mission.rarity] || 0, mission.target);
    case 'unique_type':
      return numericState(progress.byType[mission.cardType] || 0, mission.target);
    case 'unique_promo':
      return numericState(progress.promoCount, mission.target);
    case 'unique_ability':
      return numericState(progress.abilityCount, mission.target);
    case 'login_days':
      return numericState(progress.loginDays, mission.target);
    case 'wheel_days':
      return numericState(progress.wheel.days, mission.target);
    case 'guess_days':
      return numericState(progress.guess.days, mission.target);
    case 'wheel_once':
      return { current: null, target: null, completed: progress.wheel.total >= 1 };
    case 'guess_once':
      return { current: null, target: null, completed: progress.guess.total >= 1 };
    case 'action':
      return { current: null, target: null, completed: !!progress.actions[mission.action] };
    default:
      return { current: null, target: null, completed: false };
  }
}

router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await dbGet(
      `SELECT credits, credit_timer_timestamp, gems FROM users WHERE id = ?`,
      [req.userId]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = Math.floor(Date.now() / 1000);
    const regen = regenerateCredits(user.credits, user.credit_timer_timestamp, now);
    if (regen.changed) {
      await dbRun(
        `UPDATE users SET credits = ?, credit_timer_timestamp = ? WHERE id = ?`,
        [regen.credits, regen.timerTimestamp, req.userId]
      );
    }

    const progress = await getMissionProgress(req.userId);
    const claimedRows = await dbAll(`SELECT mission_id FROM mission_claims WHERE user_id = ?`, [req.userId]);
    const claimedSet = new Set(claimedRows.map(r => r.mission_id));
    const creditRoom = MAX_CREDITS - regen.credits;

    const list = missions.map(m => {
      const state = computeMissionState(m, progress);
      const claimed = claimedSet.has(m.id);
      const canClaim = state.completed && !claimed && (m.reward.credits === 0 || creditRoom >= m.reward.credits);
      return {
        id: m.id,
        description: m.description,
        reward: m.reward,
        target: state.target,
        current: state.current,
        completed: state.completed,
        claimed,
        canClaim
      };
    });

    const unclaimed = list.filter(m => !m.claimed);
    const claimedList = list.filter(m => m.claimed);

    res.json({
      missions: [...unclaimed, ...claimedList],
      credits: regen.credits,
      gems: user.gems,
      maxCredits: MAX_CREDITS
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/:missionId/claim', verifyToken, async (req, res) => {
  try {
    const mission = missions.find(m => m.id === req.params.missionId);
    if (!mission) return res.status(404).json({ error: 'Mission not found' });

    const alreadyClaimed = await dbGet(
      `SELECT 1 FROM mission_claims WHERE user_id = ? AND mission_id = ?`,
      [req.userId, mission.id]
    );
    if (alreadyClaimed) return res.status(400).json({ error: 'Mission already claimed' });

    const user = await dbGet(
      `SELECT credits, credit_timer_timestamp, gems FROM users WHERE id = ?`,
      [req.userId]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = Math.floor(Date.now() / 1000);
    const regen = regenerateCredits(user.credits, user.credit_timer_timestamp, now);

    const progress = await getMissionProgress(req.userId);
    const state = computeMissionState(mission, progress);
    if (!state.completed) return res.status(400).json({ error: 'Mission not completed yet' });

    const creditRoom = MAX_CREDITS - regen.credits;
    if (mission.reward.credits > 0 && creditRoom < mission.reward.credits) {
      return res.status(400).json({
        error: `Not enough room for ${mission.reward.credits} credits (${regen.credits}/${MAX_CREDITS})`
      });
    }

    const newCredits = regen.credits + mission.reward.credits;
    const newGems = user.gems + mission.reward.gems;

    await dbRun(
      `UPDATE users SET credits = ?, gems = ?, credit_timer_timestamp = ? WHERE id = ?`,
      [newCredits, newGems, regen.timerTimestamp, req.userId]
    );
    await dbRun(
      `INSERT INTO mission_claims (user_id, mission_id, claimed_at) VALUES (?, ?, ?)`,
      [req.userId, mission.id, now]
    );
    if (mission.reward.credits > 0) {
      await dbRun(
        `INSERT INTO credits_log (user_id, change, reason, timestamp) VALUES (?, ?, 'mission_claim', ?)`,
        [req.userId, mission.reward.credits, now]
      );
    }

    res.json({ success: true, newCredits, newGems, reward: mission.reward });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
