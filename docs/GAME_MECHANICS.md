# Hand Betting Game Mechanics

This document explains how the game works end-to-end: tile creation, round flow, scoring, dynamic tile value updates, deck reshuffling, game-over logic, and API behavior.

## 1) Core Game Concept

Each round uses three tiles:

- `Anchor` (already on table)
- `Active` (already on table)
- `Drawn` (newly drawn when you place a bet)

Player picks one bet before the draw:

- `higher`: predicts the next total will be greater
- `lower`: predicts the next total will be smaller

Totals are computed as:

- `previous_total = value(anchor) + value(active)`
- `next_total = value(active) + value(drawn)`

Outcome:

- Win if:
  - bet is `higher` and `next_total > previous_total`, or
  - bet is `lower` and `next_total < previous_total`
- Otherwise: lose

Important: a tie (`next_total == previous_total`) is a loss.

---

## 2) Tile Set and Base Values

The deck is built from Mahjong-inspired tiles:

- Number tiles:
  - labels: `1..9`
  - base value: face value (`1..9`)
  - copies: 4 of each number
- Wind tiles:
  - labels: `E`, `W`, `N`, `S`
  - base value: `5`
  - copies: 4 of each
- Dragon tiles:
  - labels: `Red`, `Green`, `White`
  - base value: `5`
  - copies: 4 of each

Current default deck mode in this repository:

- Compact recording deck: `20` tiles (used to make demo/video flow faster).
- Category coverage is preserved (numbers, winds, dragons are all present).

Compact 20-tile composition in current implementation:

| Category | Included Tiles | Count |
| --- | --- | --- |
| Numbers (base set) | `1,2,3,4,5,6,7,8,9` | 9 |
| Winds | `E,W,N,S` | 4 |
| Dragons | `Red,Green,White` | 3 |
| Extra fillers | `1,2,3,4` | 4 |
| **Total** |  | **20** |

How fillers are chosen:

- The compact builder first guarantees one of each number/wind/dragon label.
- If still below target size, it adds number tiles in ascending order (`1..9`) until target is reached.

Full-deck reference (classic config):

- Numbers: `9 * 4 = 36`
- Winds: `4 * 4 = 16`
- Dragons: `3 * 4 = 12`
- Total: `64`

---

## 3) Scoring Rules

Round scoring:

- Win: `+10`
- Loss: `-5`

Score update:

- `score_after_round = score_before_round + score_delta`

Example:

- `Bet: Higher | Totals: 11 -> 11 | Score Delta: -5`
- This is a tie (`11 == 11`), tie is not higher, so it is a loss.

---

## 4) Dynamic Special Tile Scaling

Only non-number tiles (`wind`, `dragon`) are dynamically scaled.

After each resolved round, for the 3 involved tiles (`anchor`, `active`, `drawn`):

- If outcome is win: special tile value increases by `+1`
- If outcome is loss: special tile value decreases by `-1`
- Values are clamped to range `0..10`

Number tiles never scale dynamically.

Notes:

- Dynamic values are tracked per tile instance (`tile.id`), not globally by label.
- History stores a snapshot of tile values at that round for accurate replay.

---

## 5) Round Lifecycle (State Machine)

Game statuses:

- `idle`
- `awaiting_bet`
- `resolved`
- `game_over`

Lifecycle:

1. `start_hand()`
   - draws two tiles
   - sets `current_hand = (anchor, active)`
   - status becomes `awaiting_bet`
2. `place_bet("higher" | "lower")`
3. `resolve_hand()`
   - draws one tile (`drawn`)
   - calculates totals and outcome
   - applies score delta
   - applies dynamic scaling
   - discards old anchor tile
   - appends round history
   - shifts hand window:
     - new anchor = previous active
     - new active = drawn
   - if terminal condition hit -> `game_over`
   - else returns to `awaiting_bet`

---

## 6) Deck, Discard, and Reshuffle

The deck manager keeps:

- `draw_pile`
- `discard_pile`
- `reshuffle_count`

Draw behavior:

- If draw pile has tiles: pop one tile.
- If draw pile is empty:
  - try reshuffle.
  - if reshuffle limit reached: draw fails and game can end.

Reshuffle behavior:

- New deck is created based on current configured deck mode (currently compact 20-tile mode)
- Combine with all discard tiles
- Shuffle combined list into new draw pile
- Clear discard pile
- Increment `reshuffle_count`

Practical reshuffle size formula:

- `draw_after_reshuffle = configured_deck_size + discard_before_reshuffle`
- With current compact mode: `draw_after_reshuffle = 20 + discard_before_reshuffle`

Max reshuffles allowed: `3`.

---

## 7) Game Over Conditions

Game ends when either condition is true:

1. Any tracked dynamic tile value reaches terminal bound:
   - `<= 0` or `>= 10`
2. Reshuffle limit reached:
   - `reshuffle_count >= 3` (no more reshuffles available)

Game-over reasons used by API:

- `terminal_tile_or_reshuffle_limit`
- `draw_unavailable_or_max_reshuffles`

---

## 8) Leaderboard Behavior

Leaderboard service stores score entries and returns top 5 descending.

A score is added when game transitions to `game_over`.

Entry shape:

- `score`
- `created_at` (UTC ISO timestamp)

---

## 9) API Endpoints (Gameplay)

- `POST /new-game`
  - resets engine
  - starts first hand
  - returns current score, status, hand, tiles, deck counts, history

- `GET /hand`
  - returns current active hand data and state

- `POST /bet/{choice}`
  - `choice` in `{higher, lower}`
  - resolves one round
  - returns:
    - updated score/status
    - last round details
    - full reverse-chronological history
    - next hand tiles

- `GET /leaderboard`
  - returns top 5 scores

Debug/testing endpoint:

- `POST /debug/game-over/{mode}`
  - `mode` in `{terminal-tile, reshuffle-limit}`
  - forces terminal game-over for QA/testing

---

## 10) Frontend Calculation Display Mapping

UI history line maps directly to backend fields:

- `Bet`: `round.bet`
- `Totals A -> B`: `round.previous_total -> round.next_total`
- `Score Delta`: `round.score_delta`
- `Score After`: `round.score_after_round`
- Outcome badge:
  - `WIN` if `round.outcome == "win"`
  - `LOSE` if `round.outcome == "lose"`

Tile labels in history:

- `Anchor`: old anchor tile
- `Active`: old active tile
- `Drawn`: newly drawn tile for that round

---

## 11) Example Round Walkthrough

Given:

- Anchor = White (5)
- Active = Green (6)
- Bet = `higher`
- Drawn = 4

Then:

- `previous_total = 5 + 6 = 11`
- `next_total = 6 + 4 = 10`
- Bet was `higher`, but `10` is not `> 11` -> lose
- Score delta = `-5`
- Special tiles in the round (`White`, `Green`) each shift by `-1` (clamped `0..10`)
- Round is added to history
- Hand shifts:
  - new anchor = previous active (Green)
  - new active = drawn (4)

---

## 12) Configuration (What You Can Tune)

This section describes the values you can configure to change game behavior.

### Current Code-Level Config Values

From backend code:

- `WIN_POINTS = 10`
  - Purpose: points added for a correct prediction.
- `LOSE_POINTS = -5`
  - Purpose: points subtracted for incorrect prediction (including ties).
- `SCALING_STEP = 1`
  - Purpose: how much special tiles change after each round.
- `SCALING_MIN = 0`
  - Purpose: minimum allowed dynamic tile value.
- `SCALING_MAX = 10`
  - Purpose: maximum allowed dynamic tile value.
- `MAX_RESHUFFLE_COUNT = 3`
  - Purpose: maximum number of times draw pile can be rebuilt.

### Deck/Pile Size Configuration

Deck size comes from tile factory configuration:

- `number_range = range(1, 10)`
  - Change to adjust number tiles included.
- `copies_per_number = 4`
- `copies_per_wind = 4`
- `copies_per_dragon = 4`
  - These directly control how large the draw pile is.
- `target_deck_size = 20` (current default in this repo)
  - Forces a compact deck target for faster testing/video recording.

If you want to "keep the pile up" longer:

- Increase tile copies (`copies_per_*`) to make bigger decks.
- Increase `MAX_RESHUFFLE_COUNT` to allow more reshuffles.
- Disable compact target deck mode (set `target_deck_size` to `None`) to return to full-deck sizing.

If you want shorter sessions:

- Decrease tile copies and/or lower `MAX_RESHUFFLE_COUNT`.

### Recommended Future Env Configs

For production flexibility, move these constants to environment variables:

- `GAME_WIN_POINTS`
- `GAME_LOSE_POINTS`
- `GAME_SCALING_STEP`
- `GAME_SCALING_MIN`
- `GAME_SCALING_MAX`
- `GAME_MAX_RESHUFFLES`
- `GAME_COPIES_PER_NUMBER`
- `GAME_COPIES_PER_WIND`
- `GAME_COPIES_PER_DRAGON`
- `GAME_TARGET_DECK_SIZE`

This lets non-code operators tune gameplay difficulty and session length.

### Practical Recommendation

- For demo/video: keep compact mode (`target_deck_size = 20`) for faster round turnover.
- For final gameplay realism/interview extension discussions: use full-deck mode (`target_deck_size = None` with copies-based sizing).

---

## 13) Why Shuffle Exists (Purpose)

Shuffle is not only for randomness; it serves multiple gameplay and system goals:

- Fairness:
  - prevents predictable tile order.
- Replayability:
  - each run feels different.
- Continuity:
  - when draw pile empties, reshuffle allows game to continue without manual reset.
- Difficulty control:
  - reshuffle limit provides a hard stop for session length.

In this game specifically:

- When draw pile is empty, system creates a fresh deck, combines discard pile, then shuffles.
- This process can happen up to `MAX_RESHUFFLE_COUNT` times.

---

## 14) Glossary (Meaning of Each Game Term)

- `Tile`
  - A game unit with `id`, `type`, `label`, `value`.
- `Tile Type`
  - Category of tile: `number`, `wind`, `dragon`.
- `Label`
  - Human-readable tile name (`4`, `E`, `Red`, etc.).
- `Value`
  - Numeric value used in total calculations.
- `Anchor Tile`
  - First tile in the current hand window; older context tile.
- `Active Tile`
  - Second tile in the current hand window; shared between previous and next totals.
- `Drawn Tile`
  - New tile drawn after player places a bet.
- `Hand`
  - The current playable state (`anchor`, `active`, optional bet).
- `Previous Total`
  - `anchor + active`; baseline before draw.
- `Next Total`
  - `active + drawn`; compared against previous total.
- `Bet Higher`
  - Prediction that next total will be greater than previous total.
- `Bet Lower`
  - Prediction that next total will be less than previous total.
- `Round Outcome`
  - `win` or `lose` result after comparison.
- `Score Delta`
  - Points change for one round (`+10` or `-5` by default).
- `Score After Round`
  - Running total score after applying score delta.
- `Dynamic Scaling`
  - Value adjustment for special tiles (`wind`/`dragon`) each round.
- `Draw Pile`
  - Tiles available to draw next.
- `Discard Pile`
  - Played-out tiles waiting for future reshuffle combine.
- `Reshuffle`
  - Rebuild draw pile from fresh deck + discard, then randomize order.
- `Reshuffle Count`
  - Number of reshuffles already used.
- `Game Status`
  - State machine marker: `idle`, `awaiting_bet`, `resolved`, `game_over`.
- `Game Over`
  - Terminal state when a stop condition is met.
- `Leaderboard`
  - Top 5 stored final scores from completed games.

