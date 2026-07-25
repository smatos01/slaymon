import React, { useState, useEffect } from 'react';
import './Missions.css';
import { API_URL } from '../config';

function Missions({ token, onBack, onCreditsChanged }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/missions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setMissions(data.missions || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching missions:', err);
      setLoading(false);
    }
  };

  const handleClaim = async (missionId) => {
    setError('');
    setClaimingId(missionId);
    try {
      const response = await fetch(`${API_URL}/api/missions/${missionId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error claiming reward');
        setClaimingId(null);
        return;
      }

      await fetchMissions();
      if (onCreditsChanged) onCreditsChanged();
      setClaimingId(null);
    } catch (err) {
      setError('Network error');
      setClaimingId(null);
    }
  };

  const formatReward = (reward) => {
    const parts = [];
    if (reward.credits > 0) parts.push(`🪙 +${reward.credits}`);
    if (reward.gems > 0) parts.push(`💜 +${reward.gems}`);
    return parts.join('  ');
  };

  return (
    <div className="missions-container">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="missions-area">
        <h2>📋 Missions</h2>
        <p className="missions-subtitle">Complete missions to earn credits and gems.</p>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-missions">Loading missions...</div>
        ) : (
          <div className="missions-list">
            {missions.map(mission => (
              <div
                className={`mission-card ${mission.claimed ? 'claimed' : ''}`}
                key={mission.id}
              >
                <div className="mission-info">
                  <div className="mission-description">{mission.description}</div>

                  {mission.target !== null && (
                    <div className="mission-progress">
                      <div className="progress-bar-track">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${Math.min(100, (mission.current / mission.target) * 100)}%` }}
                        />
                      </div>
                      <span className="progress-label">
                        {mission.current}/{mission.target}
                      </span>
                    </div>
                  )}

                  <div className="mission-reward">{formatReward(mission.reward)}</div>
                </div>

                <button
                  className="claim-btn"
                  onClick={() => handleClaim(mission.id)}
                  disabled={!mission.canClaim || mission.claimed || claimingId === mission.id}
                >
                  {mission.claimed ? 'Claimed' : claimingId === mission.id ? 'Claiming...' : 'Claim'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Missions;
