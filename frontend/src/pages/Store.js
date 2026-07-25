import React, { useState, useEffect } from 'react';
import './Store.css';
import { API_URL } from '../config';

const RARITY_COST = { 1: 1, 2: 5, 3: 10, 4: 20 };

function Store({ token, onBack, onGemsChanged }) {
  const [cards, setCards] = useState([]);
  const [gems, setGems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCollection();
    fetchGems();
  }, []);

  const fetchCollection = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/collection`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setCards(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching collection:', err);
      setLoading(false);
    }
  };

  const fetchGems = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setGems(data.gems);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 1: return '#90EE90';
      case 2: return '#87CEEB';
      case 3: return '#FFD700';
      case 4: return '#FF69B4';
      default: return '#CCCCCC';
    }
  };

  const getRarityText = (rarity) => {
    switch (rarity) {
      case 1: return 'Common';
      case 2: return 'Uncommon';
      case 3: return 'Rare';
      case 4: return 'Epic';
      default: return 'Unknown';
    }
  };

  const handleBuy = async () => {
    if (!selectedCard) return;
    setError('');
    setBuying(true);

    try {
      const response = await fetch(`${API_URL}/api/store/buy/${selectedCard.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error buying card');
        setBuying(false);
        return;
      }

      setGems(data.newGems);
      setCards(prev =>
        prev.map(c => (c.id === selectedCard.id ? { ...c, quantity: data.newQuantity } : c))
      );
      setSelectedCard(prev => (prev ? { ...prev, quantity: data.newQuantity } : prev));
      if (onGemsChanged) onGemsChanged();
      setBuying(false);
    } catch (err) {
      setError('Network error');
      setBuying(false);
    }
  };

  const cost = selectedCard ? RARITY_COST[selectedCard.rarity] : 0;
  const canAfford = gems >= cost;

  return (
    <div className="store-container">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <h2>🛒 Store</h2>
      <p className="store-gems">💜 {gems} Gems</p>

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
        <div className="loading">Loading store...</div>
      ) : (
        <div className="cards-grid">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`card-item ${card.quantity === 0 ? 'not-owned' : ''}`}
              onClick={() => {
                setError('');
                setSelectedCard(card);
              }}
            >
              <img src={`${API_URL}/cards/${card.image_file}`} alt={card.name} />
              <div className="card-quantity">{card.quantity}</div>
            </div>
          ))}
        </div>
      )}

      {selectedCard && (
        <div className="modal-overlay" onClick={() => setSelectedCard(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedCard(null)}>✕</button>
            <div className="card-details">
              <h3>{selectedCard.name}</h3>
              <p className="card-type" style={{ color: getRarityColor(selectedCard.rarity) }}>
                {selectedCard.type} • {getRarityText(selectedCard.rarity)}
              </p>
              <p className="owned-count">You own: {selectedCard.quantity}</p>

              <div className="buy-box">
                <p className="buy-cost">Cost: 💜 {cost}</p>
                {error && <p className="buy-error">{error}</p>}
                <button
                  className="buy-btn"
                  onClick={handleBuy}
                  disabled={buying || !canAfford}
                >
                  {buying ? 'Buying...' : !canAfford ? 'Not enough gems' : 'Buy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Store;
