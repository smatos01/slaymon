import React, { useState, useEffect } from 'react';
import './MemoryGame.css';

const CARD_BACK_URL = 'http://localhost:5000/memory/card-back.png';
const MISMATCH_DELAY_MS = 900;

function MemoryGame({ token, onBack, onCreditsChanged }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameActive, setGameActive] = useState(false);
  const [matchedPositions, setMatchedPositions] = useState([]);
  const [pendingPositions, setPendingPositions] = useState([]);
  const [images, setImages] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/game/memory/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setStatus(data);
      setLoading(false);
      setGameActive(data.hasActiveGame);

      if (data.hasActiveGame) {
        const restoredImages = {};
        const restoredMatched = [];
        (data.matchedRevealed || []).forEach(({ position, image }) => {
          restoredImages[position] = image;
          restoredMatched.push(position);
        });
        let restoredPending = [];
        if (data.firstFlipRevealed) {
          restoredImages[data.firstFlipRevealed.position] = data.firstFlipRevealed.image;
          restoredPending = [data.firstFlipRevealed.position];
        }
        setImages(restoredImages);
        setMatchedPositions(restoredMatched);
        setPendingPositions(restoredPending);
      }
    } catch (err) {
      console.error('Error fetching memory game status:', err);
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/game/memory/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error starting game');
        setSubmitting(false);
        fetchStatus();
        return;
      }

      setGameActive(true);
      setMatchedPositions([]);
      setPendingPositions([]);
      setImages({});
      setResult(null);
      setSubmitting(false);
    } catch (err) {
      setError('Network error');
      setSubmitting(false);
    }
  };

  const handleFlip = async (position) => {
    if (!gameActive || busy) return;
    if (matchedPositions.includes(position) || pendingPositions.includes(position)) return;

    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/game/memory/reveal', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ position })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error revealing card');
        setBusy(false);
        return;
      }

      setImages(prev => ({
        ...prev,
        [position]: data.image,
        ...(data.firstImage ? { [data.firstPosition]: data.firstImage } : {})
      }));

      if (data.isFirstFlip) {
        setPendingPositions([position]);
        setBusy(false);
        return;
      }

      setPendingPositions([data.firstPosition, position]);

      if (data.matched) {
        setMatchedPositions(prev => [...prev, data.firstPosition, position]);
        setPendingPositions([]);
        setBusy(false);

        if (data.gameComplete) {
          setResult(data);
          setGameActive(false);
          fetchStatus();
          if (onCreditsChanged) onCreditsChanged();
        }
      } else {
        setTimeout(() => {
          setPendingPositions([]);
          setBusy(false);
        }, MISMATCH_DELAY_MS);
      }
    } catch (err) {
      setError('Network error');
      setBusy(false);
    }
  };

  const isFaceUp = (position) => matchedPositions.includes(position) || pendingPositions.includes(position);

  return (
    <div className="memory-container">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="memory-area">
        <h2>🧠 Memory Game</h2>
        <p className="memory-subtitle">Find all 8 matching pairs!</p>

        {!loading && status && !status.canPlay && !gameActive && (
          <div className="memory-notice">
            {status.alreadyPlayedToday ? (
              <p>🕐 You already played today. Come back tomorrow!</p>
            ) : status.tooManyCredits ? (
              <p>
                ⚠️ You have {status.credits}/12 credits. You need {status.maxCreditsToPlay} or fewer to play,
                since you could win up to 5 more (max is 12).
              </p>
            ) : null}
          </div>
        )}

        {!gameActive && !result && status?.canPlay && (
          <button
            className="start-btn"
            onClick={handleStartGame}
            disabled={submitting}
          >
            Start Game
          </button>
        )}

        {gameActive && (
          <div className="memory-grid">
            {Array.from({ length: 16 }, (_, position) => {
              const faceUp = isFaceUp(position);
              return (
                <div
                  key={position}
                  className={`memory-tile ${faceUp ? 'face-up' : ''} ${matchedPositions.includes(position) ? 'matched' : ''}`}
                  onClick={() => handleFlip(position)}
                >
                  <img
                    src={faceUp ? `http://localhost:5000/memory/${images[position]}.png` : CARD_BACK_URL}
                    alt={faceUp ? images[position] : 'Face-down card'}
                  />
                </div>
              );
            })}
          </div>
        )}

        {result && (
          <div className="result-banner win">
            <p>🎉 {result.message}</p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}

export default MemoryGame;
