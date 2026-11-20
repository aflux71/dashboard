# Hangman

## Overview
Classic word-guessing game. Game Master picks a word, posts it as blanks, and players guess letters one at a time. Wrong guesses build the hangman. Collaborative — everyone works together to solve it before 6 wrong guesses.

## Phases
1. **assign** — Pick 5 words with categories, post round info
2. **word_{N}** — Post blanks, collect letter guesses (4 hours per word or until solved/failed)
3. **reveal** — Post final scores

## Setup (assign phase)
1. Pick 5 words across different categories:
   - Movies, TV Shows, Songs, Animals, Countries, Food, Sports, Brands, Famous People, Workplace
   - Words should be 5-12 letters, no obscure vocabulary
   - Single words are best; two-word phrases are OK (show the space)
2. Store in game_data: `[{word, category, guessed_letters: [], wrong_guesses: [], solved: false, solver: null}]`
3. Post to group: "🎮 **Game Master**\n\n🪢 **ROUND {N} — Hangman!**\n\n5 words to solve. Guess one letter at a time — type a single letter in the chat. 6 wrong guesses and the word is lost!\n\nFirst word coming up..."
4. Set phase to `word_1`

## Word Ideas (generate varied ones each game)
- Movies: TITANIC, GLADIATOR, INCEPTION, FROZEN, JAWS
- TV Shows: FRIENDS, SEINFELD, STRANGER, OZARK, LOST
- Animals: ELEPHANT, PENGUIN, DOLPHIN, GIRAFFE, OCTOPUS
- Countries: BRAZIL, JAPAN, ICELAND, AUSTRALIA, MEXICO
- Food: SPAGHETTI, CHOCOLATE, AVOCADO, CROISSANT, BURRITO
- Sports: BASKETBALL, HOCKEY, CRICKET, VOLLEYBALL, SURFING
- Brands: NINTENDO, SPOTIFY, SAMSUNG, NETFLIX, AMAZON

## Word Phase
1. Generate the blank display: replace each letter with `_`, keep spaces
   Example: "TITANIC" → `_ _ _ _ _ _ _`
2. Post: "🎮 **Game Master**\n\n🪢 **Word {N}/5 — {category}**\n\n`{blanks}`\n\n❤️❤️❤️❤️❤️❤️ (6 lives)\n\nGuess a letter! Type a single letter in the chat."
3. Read group messages for single-letter guesses (case-insensitive)
4. For each new letter guessed:
   - If already guessed: ignore (or reply "Already guessed!")
   - If correct: reveal all instances of that letter in the word
   - If wrong: add to wrong guesses, lose a life
5. Post updated board after each guess (or batch every few guesses):
   "🪢 `_ I _ A _ I _`\n\n✅ Correct: I, A\n❌ Wrong: E, R (4 lives left)\n❤️❤️❤️❤️🖤🖤"
6. If word is fully revealed: "🎉 **SOLVED!** The word was **TITANIC**! Great teamwork!"
7. If 6 wrong guesses: "💀 **Game over!** The word was **TITANIC**. Better luck on the next one!"
8. After solved or failed, advance to next word or reveal

## How to Process Guesses
- Accept single-letter messages (a-z, case-insensitive)
- Ignore messages that are more than 1 letter UNLESS it matches the full word (bonus guess)
- First person to guess a correct letter gets credit for scoring
- If someone types the full word correctly: instant solve, bonus points
- Track who guessed which letters in game_data

## Scoring
- **Correct letter guess:** 5 points per unique correct letter (first person to guess it)
- **Full word guess (correct):** 20 points (instant solve)
- **Full word guess (wrong):** Counts as a wrong guess (loses a life!)
- **Round survived:** 10 points to everyone who participated in a solved word
- **Perfect round:** If word solved with 0 wrong guesses: 5 bonus to all participants
- **Game winner:** Most points across all 5 words gets 15 bonus

## Reveal & Scoring
- Post recap: each word, category, whether solved, how many wrong guesses, key guessers
- Show stats: "Best guesser: {name} with {N} correct letters"
- Crown the winner with bonus points
- Fun stat: "Hardest word: {word} ({N} wrong guesses)"

## Notes
- Min 2 players, max 50 (scales great — collaborative)
- Very low barrier — just type a letter
- Fast-paced when multiple people are online
- 4-hour window per word keeps it moving, but most words solve in under an hour with active players
- The visual hangman (hearts/lives) makes it engaging to follow
- Good game for high-participation days
