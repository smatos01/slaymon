// Static mission definitions. `id` is a permanent key stored in mission_claims,
// so it must never change once players may have claimed against it.
//
// `type` drives progress computation in routes/missions.js:
//   unique_total    - distinct owned cards overall                    (target)
//   unique_rarity   - distinct owned cards of `rarity` (1-4)          (target, rarity)
//   unique_type     - distinct owned cards of `cardType` (cards.type) (target, cardType)
//   unique_ability  - distinct owned cards with a non-null ability    (target)
//   login_days      - distinct calendar days the user was active     (target)
//   wheel_once      - has ever spun the wheel at least once           (no target)
//   wheel_days      - distinct calendar days the wheel was spun       (target)
//   guess_once      - has ever completed a Guess the Number game      (no target)
//   guess_days      - distinct calendar days a game was completed     (target)
//   action          - a one-off Social action (`action`: post/like/comment)
//
// Note: cards.type uses "Mechanic" (matching the source CSV), not "Mechanical".
const missions = [
  { id: 'login_5', description: 'Login on 5 different days', type: 'login_days', target: 5, reward: { credits: 2, gems: 0 } },
  { id: 'login_10', description: 'Login on 10 different days', type: 'login_days', target: 10, reward: { credits: 3, gems: 1 } },
  { id: 'login_20', description: 'Login on 20 different days', type: 'login_days', target: 20, reward: { credits: 3, gems: 2 } },
  { id: 'login_50', description: 'Login on 50 different days', type: 'login_days', target: 50, reward: { credits: 5, gems: 5 } },

  { id: 'unique_total_10', description: 'Collect 10 unique cards', type: 'unique_total', target: 10, reward: { credits: 2, gems: 0 } },
  { id: 'unique_total_20', description: 'Collect 20 unique cards', type: 'unique_total', target: 20, reward: { credits: 3, gems: 0 } },
  { id: 'unique_total_50', description: 'Collect 50 unique cards', type: 'unique_total', target: 50, reward: { credits: 5, gems: 2 } },

  { id: 'unique_common_10', description: 'Collect 10 unique common cards', type: 'unique_rarity', rarity: 1, target: 10, reward: { credits: 2, gems: 0 } },
  { id: 'unique_common_20', description: 'Collect 20 unique common cards', type: 'unique_rarity', rarity: 1, target: 20, reward: { credits: 3, gems: 1 } },
  { id: 'unique_common_50', description: 'Collect 50 unique common cards', type: 'unique_rarity', rarity: 1, target: 50, reward: { credits: 5, gems: 2 } },

  { id: 'unique_uncommon_5', description: 'Collect 5 unique uncommon cards', type: 'unique_rarity', rarity: 2, target: 5, reward: { credits: 2, gems: 0 } },
  { id: 'unique_uncommon_10', description: 'Collect 10 unique uncommon cards', type: 'unique_rarity', rarity: 2, target: 10, reward: { credits: 3, gems: 1 } },
  { id: 'unique_uncommon_20', description: 'Collect 20 unique uncommon cards', type: 'unique_rarity', rarity: 2, target: 20, reward: { credits: 5, gems: 2 } },

  { id: 'unique_rare_2', description: 'Collect 2 unique rare cards', type: 'unique_rarity', rarity: 3, target: 2, reward: { credits: 2, gems: 0 } },
  { id: 'unique_rare_5', description: 'Collect 5 unique rare cards', type: 'unique_rarity', rarity: 3, target: 5, reward: { credits: 3, gems: 1 } },
  { id: 'unique_rare_10', description: 'Collect 10 unique rare cards', type: 'unique_rarity', rarity: 3, target: 10, reward: { credits: 5, gems: 2 } },

  { id: 'unique_epic_1', description: 'Collect 1 unique epic card', type: 'unique_rarity', rarity: 4, target: 1, reward: { credits: 2, gems: 0 } },
  { id: 'unique_epic_2', description: 'Collect 2 unique epic cards', type: 'unique_rarity', rarity: 4, target: 2, reward: { credits: 3, gems: 2 } },
  { id: 'unique_epic_5', description: 'Collect 5 unique epic cards', type: 'unique_rarity', rarity: 4, target: 5, reward: { credits: 5, gems: 5 } },

  { id: 'ability_2', description: 'Collect 2 unique cards with an ability', type: 'unique_ability', target: 2, reward: { credits: 2, gems: 0 } },
  { id: 'ability_5', description: 'Collect 5 unique cards with an ability', type: 'unique_ability', target: 5, reward: { credits: 3, gems: 1 } },
  { id: 'ability_10', description: 'Collect 10 unique cards with an ability', type: 'unique_ability', target: 10, reward: { credits: 5, gems: 2 } },
  { id: 'ability_20', description: 'Collect 20 unique cards with an ability', type: 'unique_ability', target: 20, reward: { credits: 5, gems: 5 } },

  { id: 'unique_mystic_10', description: 'Collect 10 unique mystic cards', type: 'unique_type', cardType: 'Mystic', target: 10, reward: { credits: 2, gems: 0 } },
  { id: 'unique_mystic_20', description: 'Collect 20 unique mystic cards', type: 'unique_type', cardType: 'Mystic', target: 20, reward: { credits: 3, gems: 1 } },
  { id: 'unique_mystic_50', description: 'Collect 50 unique mystic cards', type: 'unique_type', cardType: 'Mystic', target: 50, reward: { credits: 5, gems: 2 } },

  { id: 'unique_wind_10', description: 'Collect 10 unique wind cards', type: 'unique_type', cardType: 'Wind', target: 10, reward: { credits: 2, gems: 0 } },
  { id: 'unique_wind_20', description: 'Collect 20 unique wind cards', type: 'unique_type', cardType: 'Wind', target: 20, reward: { credits: 3, gems: 1 } },
  { id: 'unique_wind_50', description: 'Collect 50 unique wind cards', type: 'unique_type', cardType: 'Wind', target: 50, reward: { credits: 5, gems: 2 } },

  { id: 'unique_neutral_10', description: 'Collect 10 unique neutral cards', type: 'unique_type', cardType: 'Neutral', target: 10, reward: { credits: 2, gems: 0 } },
  { id: 'unique_neutral_20', description: 'Collect 20 unique neutral cards', type: 'unique_type', cardType: 'Neutral', target: 20, reward: { credits: 3, gems: 1 } },
  { id: 'unique_neutral_50', description: 'Collect 50 unique neutral cards', type: 'unique_type', cardType: 'Neutral', target: 50, reward: { credits: 5, gems: 2 } },

  { id: 'unique_celestial_10', description: 'Collect 10 unique celestial cards', type: 'unique_type', cardType: 'Celestial', target: 10, reward: { credits: 2, gems: 0 } },
  { id: 'unique_celestial_20', description: 'Collect 20 unique celestial cards', type: 'unique_type', cardType: 'Celestial', target: 20, reward: { credits: 3, gems: 1 } },
  { id: 'unique_celestial_50', description: 'Collect 50 unique celestial cards', type: 'unique_type', cardType: 'Celestial', target: 50, reward: { credits: 5, gems: 2 } },

  { id: 'unique_mechanic_10', description: 'Collect 10 unique mechanic cards', type: 'unique_type', cardType: 'Mechanic', target: 10, reward: { credits: 2, gems: 0 } },
  { id: 'unique_mechanic_20', description: 'Collect 20 unique mechanic cards', type: 'unique_type', cardType: 'Mechanic', target: 20, reward: { credits: 3, gems: 1 } },
  { id: 'unique_mechanic_50', description: 'Collect 50 unique mechanic cards', type: 'unique_type', cardType: 'Mechanic', target: 50, reward: { credits: 5, gems: 2 } },

  { id: 'unique_item_2', description: 'Collect 2 unique item cards', type: 'unique_type', cardType: 'Item', target: 2, reward: { credits: 2, gems: 0 } },
  { id: 'unique_item_5', description: 'Collect 5 unique item cards', type: 'unique_type', cardType: 'Item', target: 5, reward: { credits: 3, gems: 1 } },
  { id: 'unique_item_10', description: 'Collect 10 unique item cards', type: 'unique_type', cardType: 'Item', target: 10, reward: { credits: 5, gems: 2 } },

  { id: 'unique_promo_2', description: 'Collect 2 unique Promo cards', type: 'unique_promo', target: 2, reward: { credits: 2, gems: 0 } },
  { id: 'unique_promo_5', description: 'Collect 5 unique Promo cards', type: 'unique_promo', target: 5, reward: { credits: 3, gems: 1 } },
  { id: 'unique_promo_10', description: 'Collect 10 unique Promo cards', type: 'unique_promo', target: 10, reward: { credits: 5, gems: 2 } },

  { id: 'wheel_once', description: 'Play "Spin the Wheel" one time', type: 'wheel_once', reward: { credits: 2, gems: 0 } },
  { id: 'wheel_days_5', description: 'Play "Spin the Wheel" on 5 different days', type: 'wheel_days', target: 5, reward: { credits: 2, gems: 1 } },
  { id: 'wheel_days_10', description: 'Play "Spin the Wheel" on 10 different days', type: 'wheel_days', target: 10, reward: { credits: 3, gems: 2 } },
  { id: 'wheel_days_20', description: 'Play "Spin the Wheel" on 20 different days', type: 'wheel_days', target: 20, reward: { credits: 5, gems: 3 } },

  { id: 'guess_once', description: 'Play "Guess the Number" one time', type: 'guess_once', reward: { credits: 2, gems: 0 } },
  { id: 'guess_days_5', description: 'Play "Guess the Number" on 5 different days', type: 'guess_days', target: 5, reward: { credits: 2, gems: 1 } },
  { id: 'guess_days_10', description: 'Play "Guess the Number" on 10 different days', type: 'guess_days', target: 10, reward: { credits: 3, gems: 2 } },
  { id: 'guess_days_20', description: 'Play "Guess the Number" on 20 different days', type: 'guess_days', target: 20, reward: { credits: 5, gems: 3 } },

  { id: 'social_post', description: 'Make a post on Social', type: 'action', action: 'post', reward: { credits: 2, gems: 0 } },
  { id: 'social_like', description: 'Like a post on Social', type: 'action', action: 'like', reward: { credits: 2, gems: 0 } },
  { id: 'social_comment', description: 'Comment a post on Social', type: 'action', action: 'comment', reward: { credits: 2, gems: 0 } }
];

module.exports = { missions };
