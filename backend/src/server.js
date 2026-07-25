const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { initializeCards, syncCardAbilities } = require('./utils/cardData');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const cardRoutes = require('./routes/cards');
const leaderboardRoutes = require('./routes/leaderboard');
const wheelRoutes = require('./routes/wheel');
const guessRoutes = require('./routes/guess');
const memoryRoutes = require('./routes/memory');
const socialRoutes = require('./routes/social');
const missionsRoutes = require('./routes/missions');
const storeRoutes = require('./routes/store');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/wheel', wheelRoutes);
app.use('/api/game/guess', guessRoutes);
app.use('/api/game/memory', memoryRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/missions', missionsRoutes);
app.use('/api/store', storeRoutes);

app.use('/cards', express.static(path.join(__dirname, '../../frontend/public/cards')));
app.use('/memory', express.static(path.join(__dirname, '../../frontend/public/memory')));

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

db.get("SELECT COUNT(*) as count FROM cards", (err, row) => {
  if (!row || row.count === 0) {
    console.log('Initializing card data...');
    initializeCards(db);
  }
  syncCardAbilities(db);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
