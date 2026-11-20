# Would You Rather

## Overview
Vote on fun dilemmas. The twist: the MINORITY opinion scores points. Encourages creative thinking and reveals surprising preferences.

## Phases
1. **assign** — Pick 5 dilemmas, post round info
2. **vote_{N}** — Post dilemma, collect votes (3 hours per dilemma)
3. **reveal** — Post final scores, most surprising voter

## Setup (assign phase)
1. Create 5 "Would You Rather" dilemmas. Mix categories:
   - Superpowers, food, lifestyle, work, absurd, travel
   - Both options should be genuinely tempting (or genuinely terrible)
   - Avoid anything offensive or too personal
2. Store in game_data: `[{option_a, option_b, category}]`
3. Post to group: "🤔 **Would You Rather — Round {N}!**\n\n5 dilemmas. Vote for your choice. Here's the twist: the **minority opinion scores points!**\n\nThink differently to win. 🧠\n\nFirst dilemma coming up!"
4. Set phase to `vote_1`

## Dilemma Ideas (generate varied ones each game)

### Superpowers
- Fly anywhere instantly OR read anyone's mind
- Be invisible OR be able to teleport
- Speak every language OR play every instrument

### Food
- Only eat pizza forever OR never eat pizza again
- Free coffee for life OR free dessert for life
- Cook like a Michelin chef OR eat free at any restaurant

### Lifestyle
- Always be 10 minutes early OR never wait in a line
- Have a personal chef OR a personal driver
- Live in a mansion in the middle of nowhere OR a tiny apartment in the best city

### Work
- 4-day work week with same pay OR 5-day week with 30% raise
- Work from home forever OR work from a beach office forever
- Be the boss of a small company OR an employee at a dream company

### Absurd
- Fight one horse-sized duck OR 100 duck-sized horses
- Have hands for feet OR feet for hands
- Sneeze glitter OR burp confetti

### Travel
- Free flights forever but only middle seats OR pay full price but always first class
- Visit every country but only for 1 day each OR live in one dream country for 10 years
- Time travel to the past OR time travel to the future (one-way)

## Vote Phase
1. Post: "🤔 **Dilemma {N}/5 — {category}**\n\nWould you rather...\n\n🅰️ {option_a}\n\nOR\n\n🅱️ {option_b}\n\nReply with A or B!"
2. Read group messages for A or B votes
3. Each player gets one vote
4. After 3 hours or all voted:
   - Count votes for each side
   - Reveal the split: "Results: 🅰️ {count_a} votes vs 🅱️ {count_b} votes"
   - Minority voters score points
   - If tied: everyone gets 5 points

## Scoring
- **Minority vote:** 15 points
- **Majority vote:** 5 points (participation)
- **Tied vote:** Everyone gets 10 points
- **Lone wolf:** If only 1 person voted differently from everyone else: 25 points
- **Streak bonus:** 3 minority votes in a row → extra 10 points

## Reveal & Scoring
- Post recap: each dilemma, the split, who was in the minority
- Crown "Most Unique Thinker" — player in the minority the most times (10 bonus)
- Crown "Most Popular" — player in the majority the most (5 bonus, tongue in cheek)
- Fun stat: "The closest split was Dilemma {N} at {x}-{y}"

## Notes
- Min 4 players, max 50 (scales great)
- Fast rounds — 3 hour windows
- Very low barrier — no knowledge or skill needed, just opinions
- Creates great water-cooler discussion
- The minority scoring mechanic prevents groupthink and makes it strategic
- Good game to run when engagement is low — easy to participate
