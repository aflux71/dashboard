# Team Trivia

## Overview
Async trivia game. Players answer questions posted to the group. Fastest correct answer scores the most points. Works with any number of players.

## Phases
1. **assign** — Pick question set, post round info
2. **question_{N}** — Post question, collect answers (8 hours per question)
3. **reveal** — Post final scores

## Setup (assign phase)
1. Pick 5 questions across categories (general knowledge, pop culture, science, history, workplace fun)
2. Store questions in current_game.questions array: `[{question, answer, category, points}]`
3. Post to group: "🧠 **Trivia Round {N}** — 5 questions over the next few days. Answer in the group chat. Fastest correct answer gets bonus points!"
4. Set phase to `question_1`

## Question Phase
1. Post: "**Question {N}/5 — {category}**\n\n{question}\n\n⏰ You have 8 hours to answer!"
2. Read group messages — first correct answer (case-insensitive, fuzzy match) gets 10 + 5 bonus points
3. Subsequent correct answers get 10 points
4. Wrong answers get 0
5. After deadline or all players answered: post the correct answer + who got it
6. Advance to next question or reveal

## Generating Questions
Create 5 varied questions yourself. Mix difficulties. Include some workplace/fun ones. Examples:
- "What year did the first iPhone launch?" (2007)
- "What's the most popular pizza topping worldwide?" (Pepperoni)
- "In what country would you find the Great Barrier Reef?" (Australia)
Avoid questions that require extremely niche knowledge.

## Reveal & Scoring
- Post final scoreboard sorted by points
- Winner gets 10 bonus points
- Everyone who participated gets 5 participation points
- Track scores in leaderboard under `by_type.trivia`

## Notes
- Min 2 players (low barrier)
- Max 50 — anyone can play, no teams needed
- Good for large groups and new players
- Questions should NOT be answerable by just reading previous answers (don't post multiple choice)
