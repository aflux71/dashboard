# Brain Teaser

## Overview
A daily side event that runs **alongside** the main game rotation — it never touches `current_game`, `rotation_index`, or `total_rounds_played`. One riddle or puzzle per weekday, small points, quick to play. Keeps the channel lively between rounds and gives busy staff an easy way to earn points.

State lives in `game-state.json` → `brain_teaser`. Check it on **every run**, after handling the main game.

## Schedule
All times are `America/Toronto` (convert with `TZ=America/Toronto date`).

| Setting | Default | Meaning |
|---------|---------|---------|
| `enabled` | `true` | Master switch — if false, skip this whole file |
| `weekdays_only` | `true` | Only post Mon–Fri |
| `post_window_start_hour` / `post_window_end_hour` | `10` / `15` | Only post a new teaser when local time is inside this window |
| `min_hours_between` | `20` | At least this long since `last_posted_at` before a new one |
| `answer_hours` | `6` | How long a teaser stays open |

With the 2-hour check-ins this means: teaser goes up at the ~10:38am run, reveal at the ~4:38pm run.

## Each Run
1. **If `active` is set:**
   - Read channel messages since `active.posted_at` and score any new teaser answers (see *Answering*).
   - If `active.deadline` has passed → **Reveal**, then set `active` to `null`.
   - Otherwise, save the new answers and stop. No post needed.
2. **If `active` is null** and all of these are true, **post a new teaser**:
   - `enabled` is true
   - today is a weekday (if `weekdays_only`)
   - local hour is within the post window
   - `last_posted_at` is null or at least `min_hours_between` hours ago
   - you haven't already posted a reveal this run — don't stack two Game Master teaser posts in one run

## Posting a Teaser
1. Write a fresh teaser (see *Teaser Types*). Check `used_assets.brain_teaser.teasers_used` and don't repeat one.
2. Set `active`:
   ```json
   {
     "number": <count + 1>,
     "category": "Riddle",
     "question": "...",
     "answer": "Echo",
     "accepted_answers": ["echo", "an echo"],
     "explanation": "One short sentence on why",
     "posted_at": "<now UTC>",
     "deadline": "<now + answer_hours>",
     "answers": {}
   }
   ```
3. Increment `count`, set `last_posted_at`, append the question text to `used_assets.brain_teaser.teasers_used`.
4. Post to the channel:
   "🎮 **Game Master**\n\n🧩 **Brain Teaser #{number}** — {category}\n\n{question}\n\nReply in the channel starting with **teaser:** — e.g. `teaser: your answer`\n⏰ Answer revealed at {local deadline time, e.g. 4:30pm}. First correct answer gets 10 pts!"

## Answering
- Only messages that **start with `teaser`** (case-insensitive; `teaser:`, `teaser -`, `Teaser` all fine) or with 🧩 count as answers. This keeps them separate from the main game, which is running in the same channel.
- Strip the prefix and judge the rest against `answer` / `accepted_answers`. Be generous with spelling, articles, and plurals — the point is fun. If the answer is clearly right but phrased differently, accept it.
- **One answer per player** — only their first `teaser` message counts.
- Ignore the owner, Robert Achal (`855006401`) — he's the host and isn't scored (same as the main games).
- Ignore Game Master's own posts.
- Record each answer in `active.answers[user_id]`: `{name, answer, correct, first, points}`.
- If someone new (not in `players`) answers, just record them — no DM or welcome needed for teasers.

## Scoring
| Result | Points |
|--------|--------|
| First correct answer | 10 |
| Any other correct answer | 5 |
| Wrong answer | 0 |

Points go to the leaderboard at reveal time:
- Add to `leaderboard.{user_id}.points` (create the entry with `games: 0, wins: 0` if new).
- Add to `leaderboard.{user_id}.by_type.brain_teaser`: `answered` +1, `correct` +1 if right, `firsts` +1 if first, `points` +N.
- **Do not** change the top-level `games` or `wins` — those count main-rotation games only.

## Reveal
Post to the channel:
"🎮 **Game Master**\n\n🧩 **Brain Teaser #{number} — Answer**\n\n{question}\n\n✅ **{answer}** — {explanation}\n\n⚡ First: {name} (+10)\n🧠 Also got it: {names} (+5 each)\n\nNew teaser tomorrow!"

- If nobody got it: "Nobody cracked this one! 🤯" in place of the winners lines.
- On Fridays say "New teaser Monday!" instead of "tomorrow".

## Teaser Types (rotate — don't post the same type twice in a row)
- **Riddle** — "What has keys but can't open locks?" (A piano)
- **Logic** — "A farmer has 17 sheep. All but 9 run away. How many are left?" (9)
- **Number sequence** — "2, 6, 12, 20, 30, ? " (42)
- **Lateral thinking** — "A man pushes his car to a hotel and tells the owner he's bankrupt. Why?" (He's playing Monopoly)
- **Word puzzle** — "What 5-letter word becomes shorter when you add two letters?" (Short)
- **Rebus / emoji** — "🌧️ + 🏹" (Rainbow)
- **Quick math** — "If 3 cats catch 3 mice in 3 minutes, how many cats catch 100 mice in 100 minutes?" (3)

Guidelines:
- Solvable in under 5 minutes by a sharp person; no niche knowledge.
- One clear answer. Avoid trick questions with arguable answers.
- Keep it workplace-friendly. Occasional farm / lavender / Niagara themes are a nice touch.
