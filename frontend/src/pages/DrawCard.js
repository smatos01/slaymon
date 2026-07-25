import React, { useState } from 'react';
import './DrawCard.css';
import { API_URL } from '../config';

function DrawCard({ token, onBack, onCardDrawn }) {
  const [card, setCard] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [canDraw, setCanDraw] = useState(true);
  const [error, setError] = useState('');

  const handleDraw = async () => {
    if (!canDraw || isDrawing) return;

    setError('');
    setIsDrawing(true);
    setCard(null);

    try {
      const response = await fetch(`${API_URL}/api/user/draw`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error drawing card');
        setIsDrawing(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      setCard(data.card);
      setIsNew(data.isNewCard);
      setIsDrawing(false);
      setCanDraw(false);

      onCardDrawn();

      setTimeout(() => {
        setCanDraw(true);
      }, 5000);
    } catch (err) {
      setError('Network error');
      setIsDrawing(false);
    }
  };

  const getRarityEmoji = (rarity) => {
    switch (rarity) {
      case 1:
        return '🟢';
      case 2:
        return '🔵';
      case 3:
        return '⭐';
      case 4:
        return '💎';
      default:
        return '';
    }
  };

  const getRarityText = (rarity) => {
    switch (rarity) {
      case 1:
        return 'Common';
      case 2:
        return 'Uncommon';
      case 3:
        return 'Rare';
      case 4:
        return 'Epic';
      default:
        return '';
    }
  };

  return (
    <div className="draw-container">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="draw-area">
        <h2>🎰 Draw a Card</h2>

        {error && <div className="error-message">{error}</div>}

        {isDrawing && (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Drawing your card...</p>
          </div>
        )}

        {!isDrawing && !card && (
          <div className="empty-state">
            <p>Click the button below to draw a card!</p>
          </div>
        )}

        {card && !isDrawing && (
          <div className="card-display">
            {isNew && <div className="new-banner">🌟 NEW 🌟</div>}
            <img src={`${API_URL}/cards/${card.image || card.image_file}`} alt={card.name} />
            <div className="card-info">
              <h3>{card.name}</h3>
              <p className="type">{card.type}</p>
              <div className="rarity">
                {getRarityEmoji(card.rarity)} Rarity: {getRarityText(card.rarity)}
              </div>
              <p className="quantity">You now own: {card.quantity}</p>
            </div>
          </div>
        )}

        <button
          className={`draw-btn ${!canDraw ? 'disabled' : ''}`}
          onClick={handleDraw}
          disabled={isDrawing || !canDraw}
        >
          {isDrawing ? 'Drawing...' : canDraw ? 'Draw Card' : 'Wait 5 seconds...'}
        </button>
      </div>
    </div>
  );
}

export default DrawCard;
