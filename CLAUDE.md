# Slaymon Card Collection

A Pokemon-like monster card collection web game. React frontend + Node/Express backend + SQLite, run locally for development.

## Stack & layout

```
slaymon-game/
  backend/
    src/
      server.js          # Express app entry, route registration, static /cards serving, card init on boot
      database.js         # SQLite schema + migrations (ALTER TABLE, safe on existing DBs)
      routes/
        auth.js           # /api/auth/register, /login (bcrypt + JWT)
        user.js            # /api/user/profile, /collection, /draw
        cards.js           # /api/cards/all, /:id
        leaderboard.js      # /api/leaderboard (rarity breakdown per user)
        wheel.js            # /api/wheel/status, /spin (Spin the Wheel daily feature)
        guess.js             # /api/game/guess/status, /start, /guess (no give-up — see Known gotchas)
        social.js            # /api/social/posts (get/create), /:id/like, /:id/comments
        missions.js          # /api/missions (list with progress), /:missionId/claim
        store.js              # /api/store/buy/:cardId — spend gems to buy a specific card
        memory.js              # /api/game/memory/status, /start, /reveal (Memory match-pairs daily feature)
      utils/
        cardData.js         # cardsData array (84 cards) + initializeCards(db) + syncCardAbilities(db)
        credits.js           # regenerateCredits() shared credit-regen logic
        missionsData.js       # static missions array (id/type/target/reward) — id is a permanent DB key, never rename
        memoryData.js          # MEMORY_IMAGES (8 keys) + generateShuffledBoard()
    slaymon.db            # SQLite file, gitignored-style (delete to reset all data)
  frontend/
    public/cards/          # card PNGs, named "Elemental Awakening_NN.png" + "Promo.png"
    public/memory/          # Memory game assets: 8 pair PNGs (by name, e.g. Floonleef.png) + card-back.png
    public/audio/            # background music: Hidden-Glade.mp3, Haunted-Corridor.mp3, Pocket-Kingdom.mp3 (no spaces — see Known gotchas)
    src/
      pages/               # Main, Auth, CardDex, DrawCard, Store, Missions, SpinWheel, GameGuess, MemoryGame, Leaderboard, Social, InfoModal, AudioPlayer (+ .css each)
      App.js
  .claude/launch.json      # dev server configs (see below) — lives one level up in Claude/.claude/launch.json currently
```

- Backend: Node/Express, port **5000**. Frontend: Create React App, port **3000**, proxies API calls to 5000 via `"proxy"` in `frontend/package.json`.
- Auth: JWT bearer token, stored client-side; backend routes read `Authorization: Bearer <token>`.
- No ORM — raw `sqlite3` with callback-style `db.run/get/all`.

## Starting the app

Two dev servers, defined in `.claude/launch.json` (note: this currently lives at the *parent* `Claude/.claude/launch.json`, not inside `slaymon-game/`, because that's where the launch config was created):

```json
{
  "configurations": [
    { "name": "slaymon-backend", "runtimeExecutable": "npm", "runtimeArgs": ["start"], "port": 5000, "cwd": "...\\slaymon-game\\backend" },
    { "name": "slaymon-frontend", "runtimeExecutable": "npm", "runtimeArgs": ["start"], "port": 3000, "cwd": "...\\slaymon-game\\frontend" }
  ]
}
```

Start backend before frontend (frontend proxies to it). If a port is already bound by a stray `node.exe`, find the PID via `Get-NetTCPConnection -LocalPort 5000` / `netstat -ano` and `taskkill /PID <n> /F` before relaunching — don't rely on the preview tool to reuse it.

## Data model (SQLite, see `database.js`)

- `users`: id, username (unique), password_hash, credits (0-12), gems (no cap, starts at 5), credit_timer_timestamp, last_spin_date, last_guess_date, last_memory_date
- `cards`: id, name, type, rarity (1-4), hp, image_file, special_card, `ability` (TEXT, null for most cards — see Card data section), move columns (unused)
- `user_cards`: user_id, card_id, quantity — UNIQUE(user_id, card_id)
- `draws_log`, `credits_log`, `spins_log`, `number_guess_games`, `number_guess_log` — history/audit tables per feature
- `posts`, `post_likes` (UNIQUE user_id+post_id, deleted on unlike), `post_comments` — Social feature
- `social_action_log` — append-only log of 'post'/'like'/'comment' actions per user, used by Missions so an unlike doesn't erase mission progress
- `mission_claims` — UNIQUE(user_id, mission_id), one row per claimed mission reward
- `login_log` — UNIQUE(user_id, login_date), one row per calendar day a user was active; powers the "login on N days" missions (see Missions below for why it's written from `/profile`, not just `/login`)
- `purchases_log` — user_id, card_id, gems_spent, timestamp; audit trail for Store purchases
- `memory_games` — one row per Memory game; `board` (JSON array, 16 slots) and `matched` (JSON array of matched slot indices) are never sent to the client wholesale, only the images at slots the player has legitimately seen (see Memory Game below)

Migrations are additive `ALTER TABLE` calls wrapped to silently no-op if the column already exists — safe to run against an existing `slaymon.db`.

## Card data — critical convention

`backend/src/utils/cardData.js` is the **single source of truth** for all 84 cards, sourced from the user's CSV (`Tcg game - Elemental Awakening.csv`, typically in Downloads). Ground rules, learned the hard way:

- **`id_output` from the CSV (the image filename number) is the real unique identifier — never the `Name` column alone.** Several creatures share a family/name across evolution stages, and Antheara has 4 *forms* (`Forms` column: a/b/c/d) under one name.
- Card `id` in the DB is sequential 1-84 and **maps 1:1 to the image number** (`Elemental Awakening_01.png` ... `_84.png`). If you ever add/reorder cards, the image number must move with the card, not stay tied to name.
- Antheara's 4 forms are separate rows: `Antheara (a)` image _30, `(b)` _31, `(c)` _32, `(d)` _33 — display name is `"Name (form)"` when `Forms` is non-empty.
- Item cards (Potion, Card Draw, Booster, Power-Up, Remedy — ids 65-69) have `type: "Item"`, `rarity: 1`, `hp: null`. They are drawable exactly like creatures; a null field just renders blank, it does not mean "exclude this card."
- Promo cards (ids 70-84) have `special: "Promo.png"` and are excluded from the draw pool except on Sundays (see `user.js` draw logic: `availableCards = cardsData.filter(c => c.special === null)` unless `isSunday`).
- If the CSV changes, re-derive the whole array from it directly rather than patching row-by-row — manual patching is how the id/image mismatches happened in the first place.
- **Six card types exist**: `Mystic`, `Wind`, `Neutral`, `Celestial`, `Mechanic` (creatures) and `Item` (ids 65-69). Note the CSV's `Type` column says **"Mechanic", not "Mechanical"** — the type-collection missions use `cardType: 'Mechanic'` to match, and their `description` text was corrected to say "mechanic cards" (not "mechanical") for the same reason.
- **`ability` field (added later)**: the CSV's `Ability` column was originally not carried into `cardData.js`/the DB at all — only 14 of the 84 cards have a non-empty ability (ids 9, 11, 23, 33, 36, 38, 43, 46, 55, 58, 61, 63, 64, 78). These 14 now carry an `ability` string in `cardsData`, inserted via `initializeCards` for fresh DBs and backfilled into existing DBs on every boot via `syncCardAbilities(db)` (called unconditionally in `server.js`, since `initializeCards`'s `INSERT OR IGNORE` is a no-op once the 84 rows already exist).

## Feature summary

- **Auth**: register/login, bcrypt + JWT.
- **Card draw** (`/api/user/draw`): costs 1 credit, weighted rarity roll (55% common / 28% uncommon / 13% rare / 4% epic), then random card within that rarity tier from the eligible pool (promo pool only on Sundays).
- **Credits**: max 12, regenerate 1/hour via `credit_timer_timestamp`. `regenerateCredits()` in `utils/credits.js` catches up *all* missed hours at once (not just one) and is called before any credit check/spend in `/profile`, `/draw`, `/wheel/status` — this fixed a bug where users at 0 credits couldn't regenerate. Timer is only reset to a fresh 60 min when the user was previously at the 12/12 cap, not on every draw.
- **Gems**: secondary currency, starts at 5, no upper cap, purple UI (`💜`).
- **Spin the Wheel** (`wheel.js`): once/day (`last_spin_date`), blocked if credits > 7 (max win is +5). 10 segments, dynamic Sunday bonus (gems 1/2 → 3/6).
- **Guess the Number** (`guess.js`): once/day, blocked if credits ≥ 8, target 1-50, reward scales inversely with guess count (3 guesses = 5 credits, down to 8+ = 1), gem bonus 50% normally / guaranteed on Sunday. **No give-up**: there is no give-up endpoint, and the frontend disables the Back button (`GameGuess.js`) while a game is active, so a player can't bail out of a bad run to reset for a better score — only one play per day.
- **Leaderboard**: total unique cards owned + per-rarity breakdown, joined from `user_cards`/`cards`.
- **Card Dex**: shows all cards in the "Elemental Awakening" set (only set that exists so far — the set-switcher UI has a "coming soon" placeholder for future sets).
- **Social** (`social.js` / `Social.js`): nav item after Leaderboard. Post box (256 char max) + timeline sorted newest-first. Heart toggles a like (delete row on unlike); comment box under each post (256 char max). Posting/liking/commenting each log to `social_action_log` for Missions.
- **Store** (`store.js` / `Store.js`): nav item between Draw a Card and Missions. Same grid layout as Card Dex (set title + "coming soon" arrow for future sets) but shows **every** card, owned or not, with its owned quantity. Clicking any card opens a modal with name/type/rarity/owned-count/cost only — **no card image** (unlike Card Dex's zoom modal, this was an explicit correction) — cost by rarity (common 1 / uncommon 5 / rare 10 / epic 20 — `RARITY_COST` in both `store.js` and `Store.js`, keep in sync if it changes) with a Buy button. Buying is unlimited (can buy duplicates, same as drawing) and only blocked by insufficient gems — `POST /api/store/buy/:cardId` deducts gems, upserts `user_cards`, and logs to `purchases_log`.
- **Memory Game** (`memory.js` / `MemoryGame.js`): nav item after Guess the Number. Once/day (`last_memory_date`), blocked if credits > 7 (max win is +5), same messaging pattern as Guess the Number. 4x4 board, 8 unique images each appearing twice (`utils/memoryData.js`), shuffled server-side per game and never sent to the client in full — `POST /reveal` only ever discloses the image at the slot just flipped (plus the pending first-flip's image on a mismatch), so the client can't peek at the board via devtools/network inspection. Turn-based two-flip protocol: first flip of a pair returns `isFirstFlip: true` and stores `first_flip` on the game row; the second flip compares against it, clears `first_flip`, and either adds both slots to `matched` or leaves them unmatched (client re-hides them after a short delay). On the 8th match (`gameComplete: true`) rewards roll: credits 50%/40%/10% chance of +2/+3/+5, gems 50% chance of +1 (guaranteed on Sundays) — mirrors `credits_log` reason `'memory_game'`. A page refresh mid-game restores already-matched tiles and a pending first flip via `GET /status`'s `matchedRevealed`/`firstFlipRevealed`, without leaking any untouched tile. Unlike Guess the Number, the Back button is **not** disabled mid-game — the reward is a pure random roll independent of play skill, and abandoning an incomplete game already blocks starting a new one (`hasActiveGame` check), so there's no reroll exploit to guard against.
- **Missions** (`missions.js` / `Missions.js`): nav item between Draw a Card/Store and Spin the Wheel. Definitions live in `utils/missionsData.js` (55 total) — collect-N-unique-cards missions (overall, per rarity, per type, cards-with-an-ability, Promo cards, Item cards), daily-login streaks, Spin the Wheel / Guess the Number play-count missions, and 3 Social action missions. Progress for collection missions is computed live from `user_cards`/`cards` (no stored progress, one joined query in `getMissionProgress`); "play the wheel/guess game" and login missions read distinct-day counts from `spins_log`/`number_guess_games`/`login_log`; action missions (social + "play once") check for at least one matching log row. Claim button (`POST /api/missions/:missionId/claim`) is enabled only when the mission is complete, not yet claimed, and there's enough headroom under the 12-credit cap for the credit portion of the reward (gems are uncapped so never block a claim). Claimed missions sink to the bottom of the list and render greyed out.
  - **Daily-login tracking is a design choice, not a literal login count**: the JWT never expires and stays in `localStorage`, so a real user rarely calls `POST /api/auth/login` more than once. `login_log` is instead written (idempotently, via its UNIQUE constraint) from `GET /api/user/profile` — the first thing `Main.js` calls on every app load — so "login on N different days" effectively means "opened the app on N different days," which is how these missions are meant to be experienced. Also logged from actual `/auth/login` and `/auth/register` calls for completeness.
  - **Wheel/guess "play" missions count all attempts**, win or lose — `spins_log` gets a row on every spin regardless of prize, and `number_guess_games` counts any *completed* game (a correct guess; there's no give-up path anymore) via `completed_at IS NOT NULL`.
- **Info modal** (`InfoModal.js`): ℹ️ button in the header next to Logout. Static content only (no backend calls) — an accordion of collapsible sections (`SECTIONS` array, each independently toggled via an `openSections` Set) covering the game overview, what each nav section does, currency/draw odds, each mini-game's mechanics, Missions, and a visually highlighted "Sundays are special" section. Update this content when adding/changing game mechanics so it doesn't drift from reality.
- **Background music** (`AudioPlayer.js`): centered in the header (`.header` is a 3-column grid — title / player / profile+buttons — specifically so the player sits at true visual center regardless of how wide the other two sides are). Prev/Play-Pause/Next controls over the 3 tracks in `public/audio/`; the current track has the native `loop` attribute, so it repeats indefinitely until paused — switching tracks (even mid-playback) carries the playing/paused state over to the new track via a `useEffect` on `trackIndex`.

## Known gotchas

- **Several mission targets exceed what's currently collectible** — flagged rather than silently adjusted, per the user's confirmation that this is fine until the card set grows:
  - `unique_common_50` (50 unique commons, only 32 exist)
  - `unique_item_10` (10 unique items, only 5 exist: Potion/Card Draw/Booster/Power-Up/Remedy)
  - `ability_20` (20 unique ability cards, only 14 exist)
  - **Per-type card counts are small** (Mystic 17, Wind 15, Neutral 16, Celestial 15, Mechanic 16), so for every one of the 5 `unique_<type>_N` families only the `_10` tier is reachable — both `_20` and `_50` exceed every type's total and are unreachable until more cards of that type are added.
  - `unique_promo_10` is fine (15 promo cards exist).
- **Windows file locking**: `slaymon.db` cannot be deleted while the backend node process has it open — a `Remove-Item ... -ErrorAction SilentlyContinue` will *silently fail* and you'll keep re-reading stale data after a "restart." Always **stop the server first**, then delete, then verify with `Test-Path` before starting again.
- Killing a stray process on Windows: `pkill` is unreliable here — use `Get-NetTCPConnection -LocalPort <port>` (or `netstat -ano`) to get the PID, then `taskkill /PID <n> /F`.
- Card images use `http://localhost:5000/cards/<file>` with CORS `Access-Control-Allow-Origin: *` on the backend static route — if adding new frontend pages that show card images, build the URL the same way other pages do rather than relying on a relative path.
- **Never put spaces in filenames under `frontend/public/`**: a request for a space-containing path (even URL-encoded, e.g. `/audio/Hidden%20Glade.mp3`) silently fails CRA dev server's static lookup and falls through to its API proxy, which forwards it to the backend — which 404s with *its* Express/CORS headers, making the failure look like a backend routing problem instead of a static-file naming one. Original Memory/Audio assets arrived with spaces in the names and were renamed (hyphens) specifically because of this; keep new asset filenames space-free.

## Conventions / preferences

- Colorful, playful UI is the target aesthetic (this was an explicit early requirement).
- When a data field doesn't apply to a card type (e.g. `hp` for Items), render blank — never filter the card out for having a null field.
- Prefer fixing root data/logic issues over UI-level workarounds (e.g. the credit-timer bug was fixed in the shared `regenerateCredits()` utility, not patched separately in each route).
