# Who is the Spy

## Overview
Social deduction game. Everyone gets a word — but the spy gets a different one. Players give clues and vote to find the spy.

## Phases
1. **assign** — Pick word pair, assign spy, DM words
2. **clue_1** — Players post one clue in group (8 hours)
3. **clue_2** — Players post second clue in group (8 hours)
4. **voting** — Players DM their vote (8 hours)
5. **reveal** — Post results, scores, words

## Setup (assign phase)
1. Pick a random word pair from `/home/user/dashboard/lib/word-pairs.js` not in `used_assets.spy.word_pairs`
2. Randomly pick 1 spy from registered players
3. DM each player:
   - Civilians: "🕵️ **{game_type_name} — Round {N}**\n\nYour secret word is: **{civilian_word}**\n\nSomeone has a different word — find the spy! Post your clue in Company Games when the round opens."
   - Spy: "🕵️ **{game_type_name} — Round {N}**\n\nYour secret word is: **{spy_word}**\n\nYou are the SPY! Everyone else has a different word. Blend in — if you survive the vote, you win!"
4. Store in current_game: `spy_user_id`, `civilian_word`, `spy_word`
5. Post to group: "📣 **Clue Phase 1** — Post ONE short clue describing your secret word. Be descriptive but not too obvious!"

## Clue Phases
- Read group messages from active players since phase started
- Each player's first text message = their clue (ignore bot/game-master messages)
- Advance when all submitted OR deadline passed
- Post clue summary after each round
- Players who miss a phase are marked "skipped" (suspicious — mention in reveal)

## Voting Phase
- DM each player: "🗳️ Time to vote! Who is the spy? Reply here with one name."
- Post to group: "🗳️ VOTING IS OPEN! Send your secret vote to the **Game Master** bot in a DM: just the name.\n🔓 First time messaging the bot? Tap **Proceed to allow** when Cliq asks."
- Read each player's vote from the bot inbox (and their old DM chat, see *Messaging* in `game-master.md`)
- Match names fuzzy (first name is enough)
- Cannot vote for yourself
- Advance when all voted OR deadline passed

## Reveal & Scoring
- Player with most votes is "voted out" (ties = spy survives)
- If spy caught: each civilian who voted correctly → **15 points**
- If spy survived: spy → **20 points**
- Post to group:
  - Vote breakdown
  - Who was voted out + whether innocent or spy
  - Both words revealed
  - Scores
  - Pro tip for next time
- Add word pair to `used_assets.spy.word_pairs`

## Assets
Word pairs from `/home/user/dashboard/lib/word-pairs.js` — 85+ pairs across 10 categories.
