import React, { useState, useEffect } from 'react';
import './CardDex.css';

function CardDex({ token, onBack }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    fetchCollection();
  }, []);

  const fetchCollection = async () => {
    try {
      const response = await fetch('/api/user/collection', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCards(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching collection:', err);
      setLoading(false);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 1:
        return '#90EE90';
      case 2:
        return '#87CEEB';
      case 3:
        return '#FFD700';
      case 4:
        return '#FF69B4';
      default:
        return '#CCCCCC';
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
        return 'Unknown';
    }
  };

  return (
    <div className="dex-container">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <h2>📚 Card Dex</h2>

      <div className="set-switcher">
        <button
          className="set-arrow"
          onClick={() => setShowComingSoon(false)}
          style={{ visibility: showComingSoon ? 'visible' : 'hidden' }}
        >
          ←
        </button>
        <span className="set-name">
          {showComingSoon ? 'New sets coming soon' : 'Elemental Awakening'}
        </span>
        <button
          className="set-arrow"
          onClick={() => setShowComingSoon(true)}
          style={{ visibility: showComingSoon ? 'hidden' : 'visible' }}
        >
          →
        </button>
      </div>

      {showComingSoon ? (
        <div className="coming-soon">
          <p>✨ New sets coming soon! ✨</p>
        </div>
      ) : loading ? (
        <div className="loading">Loading collection...</div>
      ) : (
        <div className="cards-grid">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`card-item ${card.quantity === 0 ? 'greyed-out' : ''}`}
              onClick={() => card.quantity > 0 && setSelectedCard(card)}
            >
              <img src={`http://localhost:5000/cards/${card.image_file || card.image}`} alt={card.name} />
              {card.quantity > 0 && (
                <div className="card-quantity">{card.quantity}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedCard && (
        <div className="modal-overlay" onClick={() => setSelectedCard(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedCard(null)}>✕</button>
            <img src={`http://localhost:5000/cards/${selectedCard.image_file}`} alt={selectedCard.name} />
            <div className="card-details">
              <h3>{selectedCard.name}</h3>
              <p className="card-type" style={{ color: getRarityColor(selectedCard.rarity) }}>
                {selectedCard.type} • {getRarityText(selectedCard.rarity)}
              </p>
              {selectedCard.hp && <p>HP: {selectedCard.hp}</p>}
              <p className="owned-count">You own: {selectedCard.quantity}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardDex;
