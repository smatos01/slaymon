const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const JWT_SECRET = 'your-secret-key-change-this';
const MAX_LENGTH = 256;

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

router.get('/posts', verifyToken, async (req, res) => {
  try {
    const posts = await dbAll(
      `SELECT p.id, p.content, p.created_at, u.username
       FROM posts p JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`,
      []
    );

    const likeRows = await dbAll(
      `SELECT post_id, COUNT(*) as likeCount,
              SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) as likedByMe
       FROM post_likes GROUP BY post_id`,
      [req.userId]
    );
    const likesByPost = {};
    likeRows.forEach(r => {
      likesByPost[r.post_id] = { likeCount: r.likeCount, likedByMe: !!r.likedByMe };
    });

    const commentRows = await dbAll(
      `SELECT c.id, c.post_id, c.content, c.created_at, u.username
       FROM post_comments c JOIN users u ON c.user_id = u.id
       ORDER BY c.created_at ASC`,
      []
    );
    const commentsByPost = {};
    commentRows.forEach(c => {
      if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
      commentsByPost[c.post_id].push({
        id: c.id,
        content: c.content,
        username: c.username,
        createdAt: c.created_at
      });
    });

    res.json(
      posts.map(p => ({
        id: p.id,
        username: p.username,
        content: p.content,
        createdAt: p.created_at,
        likeCount: likesByPost[p.id]?.likeCount || 0,
        likedByMe: likesByPost[p.id]?.likedByMe || false,
        comments: commentsByPost[p.id] || []
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/posts', verifyToken, async (req, res) => {
  const content = (req.body.content || '').trim();
  if (!content) return res.status(400).json({ error: 'Post cannot be empty' });
  if (content.length > MAX_LENGTH) {
    return res.status(400).json({ error: `Post must be ${MAX_LENGTH} characters or fewer` });
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const result = await dbRun(
      `INSERT INTO posts (user_id, content, created_at) VALUES (?, ?, ?)`,
      [req.userId, content, now]
    );
    await dbRun(
      `INSERT INTO social_action_log (user_id, action, timestamp) VALUES (?, 'post', ?)`,
      [req.userId, now]
    );

    const user = await dbGet(`SELECT username FROM users WHERE id = ?`, [req.userId]);

    res.json({
      id: result.lastID,
      username: user?.username,
      content,
      createdAt: now,
      likeCount: 0,
      likedByMe: false,
      comments: []
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/posts/:id/like', verifyToken, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) return res.status(400).json({ error: 'Invalid post' });

  try {
    const post = await dbGet(`SELECT id FROM posts WHERE id = ?`, [postId]);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const existing = await dbGet(
      `SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?`,
      [postId, req.userId]
    );
    const now = Math.floor(Date.now() / 1000);

    if (existing) {
      await dbRun(`DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`, [postId, req.userId]);
    } else {
      await dbRun(
        `INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)`,
        [postId, req.userId, now]
      );
      await dbRun(
        `INSERT INTO social_action_log (user_id, action, timestamp) VALUES (?, 'like', ?)`,
        [req.userId, now]
      );
    }

    const countRow = await dbGet(`SELECT COUNT(*) as cnt FROM post_likes WHERE post_id = ?`, [postId]);
    res.json({ likeCount: countRow.cnt, likedByMe: !existing });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/posts/:id/comments', verifyToken, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) return res.status(400).json({ error: 'Invalid post' });

  const content = (req.body.content || '').trim();
  if (!content) return res.status(400).json({ error: 'Comment cannot be empty' });
  if (content.length > MAX_LENGTH) {
    return res.status(400).json({ error: `Comment must be ${MAX_LENGTH} characters or fewer` });
  }

  try {
    const post = await dbGet(`SELECT id FROM posts WHERE id = ?`, [postId]);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const now = Math.floor(Date.now() / 1000);
    const result = await dbRun(
      `INSERT INTO post_comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)`,
      [postId, req.userId, content, now]
    );
    await dbRun(
      `INSERT INTO social_action_log (user_id, action, timestamp) VALUES (?, 'comment', ?)`,
      [req.userId, now]
    );

    const user = await dbGet(`SELECT username FROM users WHERE id = ?`, [req.userId]);

    res.json({
      id: result.lastID,
      content,
      username: user?.username,
      createdAt: now
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
