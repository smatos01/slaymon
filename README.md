# 🃏 Slaymon Card Collection Game

A colorful card collection game where you can draw cards, build your collection, and compete on the leaderboard!

## Setup

### Prerequisites
- Node.js (v16 or higher)
- npm (comes with Node.js)

### Installation

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

## Running the Game

You'll need to run two servers: the backend API and the React frontend.

### Terminal 1 - Backend Server
```bash
cd backend
npm start
```
The backend will run on `http://localhost:5000`

### Terminal 2 - Frontend Server
```bash
cd frontend
npm start
```
The frontend will automatically open at `http://localhost:3000`

## Game Features

### Login & Registration
- Create a new account or login with existing credentials
- All user data is saved securely

### Card Dex
- View all cards you've collected
- Cards you haven't collected yet appear greyed out
- Click any card to see details and quantity owned

### Draw Cards
- Use 1 credit to draw a card
- Credits regenerate at a rate of 1 per hour (max 12)
- See rarity indicator and if it's a new card
- On Sundays, you can draw special promo cards

### Leaderboard
- See all players ranked by total cards collected
- Filter by rarity level

## Credits System

- **Start**: 12 credits when you register
- **Usage**: 1 credit per card draw
- **Regeneration**: 1 credit every 60 minutes
- **Maximum**: 12 credits

## Card Rarity Distribution

When you draw a card (excluding Sundays):
- 55% Common (🟢)
- 28% Uncommon (🔵)
- 13% Rare (⭐)
- 4% Epic (💎)

On **Sundays**, all cards (including promos) are available.

## File Structure

```
slaymon-game/
├── backend/              # Node.js/Express server
│   ├── src/
│   │   ├── server.js     # Main server file
│   │   ├── database.js   # SQLite setup
│   │   ├── routes/       # API endpoints
│   │   └── utils/        # Card data
│   └── package.json
│
├── frontend/             # React app
│   ├── src/
│   │   ├── pages/        # Game pages
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   │   ├── cards/        # Card images
│   │   └── index.html
│   └── package.json
│
└── README.md
```

## Troubleshooting

**"Cannot connect to backend"**
- Make sure the backend is running on port 5000
- Check that you're not blocked by a firewall

**"Cards not loading"**
- Clear your browser cache
- Make sure all card images are in `frontend/public/cards/`

**"Database error"**
- The database is created automatically on first run
- Check that you have write permissions in the `backend` folder
