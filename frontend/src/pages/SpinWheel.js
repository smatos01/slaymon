import React, { useState, useEffect, useRef } from 'react';
import './SpinWheel.css';
import { API_URL } from '../config';


// Fixed colors by structural role (index), independent of the day-specific labels
const SEGMENT_COLORS = [
  '#4a4a6a', // No Win
  '#66bb6a', // +1 credit
  '#4a4a6a', // No Win
  '#42a5f5', // +3 credit
  '#4a4a6a', // No Win
  '#ffd700', // +5 credit
  '#4a4a6a', // No Win
  '#ab47bc', // gem (low)
  '#4a4a6a', // No Win
  '#7b1fa2'  // gem (high)
];

const DEFAULT_LABELS = ['No Win', '+1🪙', 'No Win', '+3🪙', 'No Win', '+5🪙', 'No Win', '+1 💎', 'No Win', '+2 💎'];

const SEGMENT_COUNT = 10;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;
const WHEEL_SIZE = 300;
const CENTER = WHEEL_SIZE / 2;
const LABEL_RADIUS = 110;

function SpinWheel({ token, onBack, onCreditsChanged }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const rotationRef = useRef(0);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wheel/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setStatus(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching wheel status:', err);
      setLoading(false);
    }
  };

  const labels = status?.segments ? status.segments.map(s => s.label) : DEFAULT_LABELS;

  const handleSpin = async () => {
    if (spinning || !status?.canSpin) return;

    setError('');
    setResult(null);
    setSpinning(true);

    try {
      const response = await fetch(`${API_URL}/api/wheel/spin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error spinning the wheel');
        setSpinning(false);
        fetchStatus();
        return;
      }

      const centerAngle = data.segmentIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
      const targetMod = (360 - centerAngle) % 360;
      const prevMod = rotationRef.current % 360;
      const delta = (targetMod - prevMod + 360) % 360;
      const extraSpins = 5 * 360;
      const newRotation = rotationRef.current + extraSpins + delta;

      rotationRef.current = newRotation;
      setRotation(newRotation);

      setTimeout(() => {
        setResult(data);
        setSpinning(false);
        fetchStatus();
        if (onCreditsChanged) onCreditsChanged();
      }, 4200);
    } catch (err) {
      setError('Network error');
      setSpinning(false);
    }
  };

  const conicGradient = `conic-gradient(${SEGMENT_COLORS.map(
    (color, i) => `${color} ${i * SEGMENT_ANGLE}deg ${(i + 1) * SEGMENT_ANGLE}deg`
  ).join(', ')})`;

  const isWin = result && (result.creditsWon > 0 || result.gemsWon > 0);

  return (
    <div className="wheel-container">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="wheel-area">
        <h2>🎡 Spin the Wheel</h2>
        <p className="wheel-subtitle">
          Spin once a day for a chance to win bonus credits or gems!
          {status?.isSunday && ' 🎉 It\'s Sunday — gem prizes are boosted!'}
        </p>

        {!loading && status && !status.canSpin && (
          <div className="wheel-notice">
            {status.alreadySpunToday ? (
              <p>🕐 You've already spun the wheel today. Come back tomorrow!</p>
            ) : status.tooManyCredits ? (
              <p>
                ⚠️ You have {status.credits}/12 credits. You need {status.maxCreditsToSpin} or fewer to spin,
                since you could win up to 5 more (max is 12).
              </p>
            ) : null}
          </div>
        )}

        <div className="wheel-wrapper">
          <div className="wheel-pointer">▼</div>
          <div
            className="wheel"
            style={{
              transform: `rotate(${rotation}deg)`,
              background: conicGradient
            }}
          >
            {labels.map((label, i) => {
              const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
              const x = CENTER + LABEL_RADIUS * Math.sin((angle * Math.PI) / 180);
              const y = CENTER - LABEL_RADIUS * Math.cos((angle * Math.PI) / 180);
              return (
                <div
                  key={i}
                  className="wheel-label"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {result && !spinning && (
          <div className={`result-banner ${isWin ? 'win' : 'no-win'}`}>
            {!isWin && '😢 No win this time. Try again tomorrow!'}
            {result.creditsWon > 0 && `🎉 You won ${result.creditsWon} credit${result.creditsWon > 1 ? 's' : ''}!`}
            {result.creditsWon > 0 && result.gemsWon > 0 && ' '}
            {result.gemsWon > 0 && `💜 You won ${result.gemsWon} gem${result.gemsWon > 1 ? 's' : ''}!`}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <button
          className="spin-btn"
          onClick={handleSpin}
          disabled={loading || spinning || !status?.canSpin}
        >
          {spinning ? 'Spinning...' : 'Spin the Wheel'}
        </button>
      </div>
    </div>
  );
}

export default SpinWheel;
