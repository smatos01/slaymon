import React, { useState } from 'react';
import './InfoModal.css';

const SECTIONS = [
  {
    id: 'overview',
    icon: '🎮',
    title: 'What is Slaymon?',
    body: (
      <p>
        Slaymon is a monster card collection game. Collect creatures from the "Elemental
        Awakening" set by drawing cards with credits or buying specific ones in the Store with
        gems, complete missions for bonus rewards, play a free daily mini-game or two, and
        compare your collection with other players on the Leaderboard and Social.
      </p>
    )
  },
  {
    id: 'sections',
    icon: '🗂️',
    title: 'What each section does',
    body: (
      <ul>
        <li><strong>📚 Card Dex</strong> — browse every card in the set and see how many of each you own.</li>
        <li><strong>🎰 Draw a Card</strong> — spend 1 credit for a random card.</li>
        <li><strong>🛒 Store</strong> — browse the full set and buy any specific card directly with gems.</li>
        <li><strong>📋 Missions</strong> — complete objectives (collecting cards, logging in, playing games, using Social) for credit and gem rewards.</li>
        <li><strong>🎡 Spin the Wheel</strong> — a free once-a-day spin for bonus credits or gems.</li>
        <li><strong>🎯 Guess the Number</strong> — a free once-a-day number-guessing game for bonus credits or gems.</li>
        <li><strong>🧠 Memory Game</strong> — a free once-a-day match-the-pairs game for bonus credits or gems.</li>
        <li><strong>🏆 Leaderboard</strong> — see how your total unique cards and rarity breakdown compare to other players.</li>
        <li><strong>💬 Social</strong> — post, like, and comment with other players (256 characters max per post/comment).</li>
      </ul>
    )
  },
  {
    id: 'currency',
    icon: '🪙',
    title: 'Currency & card draw odds',
    body: (
      <>
        <ul>
          <li><strong>Credits</strong> — capped at 12, regenerate 1 per hour, spend 1 to draw a card.</li>
          <li><strong>Gems (💜)</strong> — no cap, earned from mini-games and missions, spent in the Store.</li>
        </ul>
        <p className="info-subheading">Draw a Card rarity odds:</p>
        <ul>
          <li>🟢 Common — 55%</li>
          <li>🔵 Uncommon — 28%</li>
          <li>⭐ Rare — 13%</li>
          <li>💎 Epic — 4%</li>
        </ul>
        <p className="info-subheading">Store prices by rarity:</p>
        <ul>
          <li>🟢 Common — 1 gem</li>
          <li>🔵 Uncommon — 5 gems</li>
          <li>⭐ Rare — 10 gems</li>
          <li>💎 Epic — 20 gems</li>
        </ul>
      </>
    )
  },
  {
    id: 'wheel',
    icon: '🎡',
    title: 'Spin the Wheel details',
    body: (
      <ul>
        <li>Once per day, only playable with 7 or fewer credits (you could win up to 5 more, and credits cap at 12).</li>
        <li>10 segments, alternating "No Win" and a reward: +1, +3, or +5 credits, or +1/+2 gems.</li>
      </ul>
    )
  },
  {
    id: 'guess',
    icon: '🎯',
    title: 'Guess the Number details',
    body: (
      <ul>
        <li>Once per day, only playable with 7 or fewer credits.</li>
        <li>Guess a number between 1 and 50 — fewer guesses means a bigger reward: 3 or fewer guesses wins 5 credits, down to just 1 credit at 8+ guesses.</li>
        <li>50% chance of an extra bonus gem.</li>
        <li>Once a game is started, you can't leave until you guess correctly — no giving up to reroll for a better score.</li>
      </ul>
    )
  },
  {
    id: 'memory',
    icon: '🧠',
    title: 'Memory Game details',
    body: (
      <ul>
        <li>Once per day, only playable with 7 or fewer credits.</li>
        <li>Find all 8 matching pairs on the 4x4 board to complete the game.</li>
        <li>Reward on completion: 50% chance of +2 credits, 40% chance of +3 credits, 10% chance of +5 credits.</li>
        <li>50% chance of an extra bonus gem.</li>
      </ul>
    )
  },
  {
    id: 'missions',
    icon: '📋',
    title: 'Missions',
    body: (
      <ul>
        <li>55 missions covering card collection (overall, by rarity, by type, cards with an ability, Promo cards, Item cards), logging in on different days, playing the mini-games, and using Social.</li>
        <li>The Claim button only lights up once a mission is complete <em>and</em> there's enough room under your 12-credit cap for the credit part of the reward — gems have no cap, so they never block a claim.</li>
        <li>Claimed missions move to the bottom of the list and grey out.</li>
      </ul>
    )
  },
  {
    id: 'sunday',
    icon: '🌞',
    title: 'Sundays are special!',
    highlight: true,
    body: (
      <ul>
        <li><strong>Promo cards join the draw pool</strong> — the only day you can draw them.</li>
        <li><strong>Spin the Wheel's gem prizes are boosted</strong> (from +1/+2 up to +3/+6 gems).</li>
        <li><strong>Guess the Number's bonus gem is guaranteed</strong>, instead of a 50/50 chance.</li>
        <li><strong>Memory Game's bonus gem is guaranteed</strong>, instead of a 50/50 chance.</li>
      </ul>
    )
  }
];

function InfoModal({ onClose }) {
  const [openSections, setOpenSections] = useState(new Set(['overview']));

  const toggleSection = (id) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className="info-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>
        <h2>ℹ️ How to Play Slaymon</h2>

        <div className="info-accordion">
          {SECTIONS.map(section => {
            const isOpen = openSections.has(section.id);
            return (
              <div
                key={section.id}
                className={`info-section ${section.highlight ? 'highlight' : ''} ${isOpen ? 'open' : ''}`}
              >
                <button className="info-section-header" onClick={() => toggleSection(section.id)}>
                  <span>{section.icon} {section.title}</span>
                  <span className="info-chevron">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && <div className="info-section-body">{section.body}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default InfoModal;
