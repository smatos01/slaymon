import React, { useState, useEffect } from 'react';
import './GameGuess.css';
import { API_URL } from '../config';

function GameGuess({ token, onBack, onCreditsChanged }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameActive, setGameActive] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [guessCount, setGuessCount] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/game/guess/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setStatus(data);
      setLoading(false);
      setGameActive(data.hasActiveGame);
    } catch (err) {
      console.error('Error fetching game status:', err);
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/game/guess/start`, {
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
      setGuessInput('');
      setGuessCount(0);
      setFeedback('');
      setResult(null);
      setSubmitting(false);
    } catch (err) {
      setError('Network error');
      setSubmitting(false);
    }
  };

  const handleGuess = async (e) => {
    e.preventDefault();

    const num = parseInt(guessInput, 10);
    if (isNaN(num) || num < 1 || num > 50) {
      setError('Please enter a number between 1 and 50');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/game/guess/guess`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ guessNumber: num })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error submitting guess');
        setSubmitting(false);
        return;
      }

      setGuessCount(data.guessCount);

      if (data.correct) {
        setResult(data);
        setGameActive(false);
        fetchStatus();
        if (onCreditsChanged) onCreditsChanged();
      } else {
        setFeedback(data.feedback);
      }

      setGuessInput('');
      setSubmitting(false);
    } catch (err) {
      setError('Network error');
      setSubmitting(false);
    }
  };

  return (
    <div className="game-container">
      <button
        className="back-btn"
        onClick={onBack}
        disabled={gameActive}
        title={gameActive ? 'Guess the number correctly before leaving' : undefined}
      >
        ← Back
      </button>

      <div className="game-area">
        <h2>🎯 Guess the Number</h2>
        <p className="game-subtitle">I'm thinking of a number between 1 and 50. Can you guess it?</p>

        {!loading && status && !status.canPlay && !gameActive && (
          <div className="game-notice">
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
          <div className="game-content">
            <p className="guess-counter">Guesses made: {guessCount}</p>

            <form onSubmit={handleGuess}>
              <input
                type="number"
                min="1"
                max="50"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Enter a number..."
                disabled={submitting}
              />
              <button type="submit" disabled={submitting}>
                {submitting ? 'Guessing...' : 'Guess'}
              </button>
            </form>

            {feedback && (
              <div className={`feedback ${feedback}`}>
                <p>The number is <strong>{feedback}</strong></p>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className={`result-banner ${result.correct ? 'win' : 'lose'}`}>
            {result.correct ? (
              <>
                <p>🎉 Correct! The number was {result.targetNumber}</p>
                <p>You took {result.guessCount} guess{result.guessCount > 1 ? 'es' : ''}</p>
                <p>💰 You won {result.creditsWon} credit{result.creditsWon > 1 ? 's' : ''}{result.gemsWon > 0 ? ` and ${result.gemsWon} gem${result.gemsWon > 1 ? 's' : ''}` : ''}!</p>
              </>
            ) : (
              <>
                <p>The number was {result.targetNumber}</p>
                <p>Better luck next time!</p>
              </>
            )}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}

export default GameGuess;
