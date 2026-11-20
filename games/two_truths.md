# Two Truths & a Lie

## Overview
Each player posts 3 statements about themselves — 2 true, 1 false. Everyone else guesses which is the lie. Great for team bonding.

## Phases
1. **assign** — Explain the rules, DM players to submit their statements
2. **submit** — Players DM their 3 statements (24 hours)
3. **guess_{N}** — Post one player's statements, others guess the lie (8 hours each)
4. **reveal** — Post final scores

## Setup (assign phase)
1. DM each player: "🤥 **Two Truths & a Lie — Round {N}**\n\nDM me 3 statements about yourself:\n- 2 that are TRUE\n- 1 that is a LIE\n\nLabel them clearly:\nTruth 1: ...\nTruth 2: ...\nLie: ...\n\nI'll post them in random order and everyone will try to guess which is the lie!"
2. Post to group: "🤥 **Two Truths & a Lie** — Check your DMs! Send me your 3 statements (2 truths + 1 lie). You have 24 hours."
3. Set phase to `submit`
4. Store in game_data: `submissions: {}`

## Submit Phase
1. Check each player's DM for their 3 statements
2. Parse: look for "truth" and "lie" labels, or take the 3 lines they send
3. Store in game_data.submissions: `{ user_id: { truths: [...], lie: "..." } }`
4. When all submitted or deadline passed:
   - Players who didn't submit are skipped for this round
   - Randomize the order players will be featured
   - Set phase to `guess_1`

## Guess Phase (one per player who submitted)
1. Post the current player's 3 statements in RANDOM order (don't reveal which is the lie):
   "🤔 **Which is the lie?** — Statements from **{player_name}**:\n\nA) {statement_1}\nB) {statement_2}\nC) {statement_3}\n\nReply with A, B, or C!"
2. Read group messages for A/B/C responses from other players (not the featured player)
3. Each player gets one guess
4. After 8 hours or all guessed:
   - Reveal the lie: "The lie was **{letter})** — {lie_text}!"
   - List who got it right
   - Advance to next player or reveal if all done

## Scoring
- **Guessing correctly:** 10 points per correct guess
- **Fooling others:** The featured player gets 5 points for each person they fooled
- **Participation:** 5 points just for submitting statements
- Best liar bonus: Player who fooled the most people gets 15 bonus points

## Notes
- Min 4 players, max 12
- Encourage fun/surprising statements — not obvious lies
- Skip a player's guess round if they didn't submit
- The featured player cannot guess on their own statements
- This game takes longer (8 hours × number of players for guess phases) — factor that in
