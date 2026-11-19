# Word Chain

## Overview
Players take turns adding words to a chain. Each word must start with the last letter of the previous word. Theme-based rounds add a twist — words must fit the category.

## Phases
1. **assign** — Pick theme, set player order, post rules
2. **play_{N}** — Each round: players add words in order (4 hours per turn, 12 hours per round)
3. **reveal** — Post chain, scores, longest streak

## Setup (assign phase)
1. Pick a theme from the theme list (not recently used):
   - Food & Drink, Animals, Countries & Cities, Movies & TV, Things in an Office,
   - Sports, Music, Nature, Things That Are Red, Holiday Items,
   - Tools & Equipment, Clothing, Things at the Beach, Vehicles, Emotions
2. Shuffle player order randomly
3. Post to group: "🔗 **Word Chain Round {N}** — Theme: **{theme}**\n\nRules: Each word must START with the LAST LETTER of the previous word AND fit the theme.\n\nPlayer order: {list}\n\nFirst player starts! Post your word."
4. Post the seed word (a word fitting the theme to kick it off)
5. Store: theme, player_order, chain (starting with seed word)

## Play Phase
- Players post words in order (turn-based, not all at once)
- DM the current player: "🔗 It's your turn! The last word was **{word}**. Post a word starting with '{last_letter}' that fits the theme **{theme}**."
- Also post in group: "⏳ Waiting on **{player_name}** — word must start with '{last_letter}'"
- Valid word: starts with correct letter + fits theme (use judgment, be generous)
- Invalid word: player gets a warning, can retry once. Second fail = skipped, loses 5 points
- Each valid word = 10 points
- If a player doesn't respond within 4 hours: skip them, next player goes
- Round ends after going through the full player order twice (2 laps)

## Reveal & Scoring
- Post the full chain
- 10 points per valid word contributed
- 15 bonus points for the player with the most words
- 10 bonus for longest sub-chain without a skip
- Deduct 5 for each skip/invalid
- Track in leaderboard under `by_type.word_chain`

## Notes
- Min 3 players, max 20
- More sequential/turn-based — good variety from the all-at-once games
- Keep theme list in `used_assets.word_chain.themes` to avoid repeats
