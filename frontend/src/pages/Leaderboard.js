import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

function Leaderboard({ token, onBack }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setLeaderboard(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setLoading(false);
    }
  };

  return (
    <div className="leaderboard-container">
      <button className="back-btn" onClick={onBack}>← Back</button>

      {loading ? (
        <div className="loading">Loading leaderboard...</div>
      ) : (
        <>
          <h2>🏆 Leaderboard</h2>
          <div className="table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Username</th>
                  <th>Total Cards</th>
                  <th>🟢 Common</th>
                  <th>🔵 Uncommon</th>
                  <th>⭐ Rare</th>
                  <th>💎 Epic</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={index} className={index < 3 ? `rank-${index + 1}` : ''}>
                    <td className="rank">
                      {index === 0
                        ? '🥇'
                        : index === 1
                        ? '🥈'
                        : index === 2
                        ? '🥉'
                        : index + 1}
                    </td>
                    <td className="username">{entry.username}</td>
                    <td className="total-cards"><strong>{entry.total_cards || 0}</strong></td>
                    <td>{entry.rarity_1 || 0}</td>
                    <td>{entry.rarity_2 || 0}</td>
                    <td>{entry.rarity_3 || 0}</td>
                    <td>{entry.rarity_4 || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Leaderboard;
