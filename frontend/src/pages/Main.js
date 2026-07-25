import React, { useState, useEffect } from 'react';
import './Main.css';
import CardDex from './CardDex';
import DrawCard from './DrawCard';
import Store from './Store';
import Missions from './Missions';
import Leaderboard from './Leaderboard';
import SpinWheel from './SpinWheel';
import GameGuess from './GameGuess';
import MemoryGame from './MemoryGame';
import Social from './Social';
import InfoModal from './InfoModal';
import AudioPlayer from './AudioPlayer';

function Main({ token, userId, username, onLogout }) {
  const [currentPage, setCurrentPage] = useState('home');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    fetchProfile();
    const interval = setInterval(fetchProfile, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProfile(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="main-container">
      <header className="header">
        <h1>🃏 Slaymon Card Collection</h1>
        <div className="header-center">
          <AudioPlayer />
        </div>
        <div className="header-right">
          <div className="profile-info">
            <div className="username">{username}</div>
            {profile && (
              <>
                <div className="credits">🪙 {profile.credits}/12 Credits</div>
                <div className="gems">💜 {profile.gems} Gems</div>
                {profile.credits < 12 && (
                  <div className="credit-timer">
                    ⏰ {profile.minutesUntilNextCredit}m until next credit
                  </div>
                )}
                {profile.isSunday && (
                  <div className="promo-banner">🎉 It's Promo Sunday! Promo cards available! 🎉</div>
                )}
              </>
            )}
          </div>
          <button className="info-btn" onClick={() => setShowInfo(true)}>ℹ️ Info</button>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}

      {currentPage === 'home' && (
        <div className="home-container">
          <nav className="nav-buttons">
            <button className="nav-btn" onClick={() => setCurrentPage('dex')}>
              📚 Card Dex
            </button>
            <button className="nav-btn" onClick={() => setCurrentPage('draw')}>
              🎰 Draw a Card
            </button>
            <button className="nav-btn" onClick={() => setCurrentPage('store')}>
              🛒 Store
            </button>
            <button className="nav-btn" onClick={() => setCurrentPage('missions')}>
              📋 Missions
            </button>
            <button className="nav-btn" onClick={() => setCurrentPage('wheel')}>
              🎡 Spin the Wheel
            </button>
            <button className="nav-btn" onClick={() => setCurrentPage('guess')}>
              🎯 Guess the Number
            </button>
            <button className="nav-btn" onClick={() => setCurrentPage('memory')}>
              🧠 Memory Game
            </button>
            <button className="nav-btn" onClick={() => setCurrentPage('leaderboard')}>
              🏆 Leaderboard
            </button>
            <button className="nav-btn" onClick={() => setCurrentPage('social')}>
              💬 Social
            </button>
          </nav>
        </div>
      )}

      {currentPage === 'dex' && (
        <CardDex token={token} onBack={() => setCurrentPage('home')} />
      )}

      {currentPage === 'draw' && (
        <DrawCard
          token={token}
          onBack={() => {
            setCurrentPage('home');
            fetchProfile();
          }}
          onCardDrawn={fetchProfile}
        />
      )}

      {currentPage === 'wheel' && (
        <SpinWheel
          token={token}
          onBack={() => {
            setCurrentPage('home');
            fetchProfile();
          }}
          onCreditsChanged={fetchProfile}
        />
      )}

      {currentPage === 'guess' && (
        <GameGuess
          token={token}
          onBack={() => {
            setCurrentPage('home');
            fetchProfile();
          }}
          onCreditsChanged={fetchProfile}
        />
      )}

      {currentPage === 'memory' && (
        <MemoryGame
          token={token}
          onBack={() => {
            setCurrentPage('home');
            fetchProfile();
          }}
          onCreditsChanged={fetchProfile}
        />
      )}

      {currentPage === 'leaderboard' && (
        <Leaderboard token={token} onBack={() => setCurrentPage('home')} />
      )}

      {currentPage === 'store' && (
        <Store
          token={token}
          onBack={() => setCurrentPage('home')}
          onGemsChanged={fetchProfile}
        />
      )}

      {currentPage === 'missions' && (
        <Missions
          token={token}
          onBack={() => setCurrentPage('home')}
          onCreditsChanged={fetchProfile}
        />
      )}

      {currentPage === 'social' && (
        <Social token={token} onBack={() => setCurrentPage('home')} />
      )}
    </div>
  );
}

export default Main;
