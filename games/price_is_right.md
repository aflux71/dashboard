# Price is Right

## Overview
Guess the retail price of random products. Closest guess without going over wins the round. Classic format, works great async.

## Phases
1. **assign** — Pick 5 products with prices, post round info
2. **price_{N}** — Post product, collect guesses (8 hours per product)
3. **reveal** — Post final scores, biggest winner

## Setup (assign phase)
1. Create 5 product rounds. For each, pick a real product with a reasonable price:
   - Mix categories: electronics, food, household, clothing, random fun items
   - Price range: $5 to $500 (keep it interesting)
   - Be specific: "Apple AirPods Pro 2nd Gen" not just "headphones"
2. Store products in game_data: `[{name, description, actual_price, category}]`
3. Post to group: "💰 **The Price is Right — Round {N}!**\n\n5 products. Guess the retail price. Closest WITHOUT going over wins!\n\nIf everyone goes over, closest overall wins.\n\nRound 1 coming up!"
4. Set phase to `price_1`

## Product Ideas (generate varied ones each game)
- Electronics: AirPods, Nintendo Switch, Kindle, GoPro, Roomba
- Food: 1lb Wagyu steak, truffle oil, large Domino's pizza, Starbucks Venti latte
- Household: Dyson V15 vacuum, KitchenAid mixer, Instant Pot, Yeti cooler
- Clothing: Nike Air Max, Lululemon leggings, Canada Goose jacket
- Fun: LEGO Millennium Falcon, Monopoly board game, real lightsaber replica
- Random: 1 gallon of maple syrup, movie theater popcorn, Times Square billboard (1 day)

Use current approximate retail prices. Be accurate — players will check!

## Price Phase
1. Post: "💰 **Product {N}/5 — {category}**\n\n**{product_name}**\n{description}\n\nWhat's the retail price? Reply with your guess (just the number, e.g. 149.99)\n\n⏰ 8 hours to guess!"
2. Read group messages for numeric guesses from players
3. Each player gets one guess (take their first number)
4. Parse prices: strip $, commas, handle "150", "$149.99", "about 200" etc.
5. After deadline or all guessed:
   - Reveal actual price
   - Show who was closest without going over
   - If everyone went over, closest overall wins
   - Post: "The actual price is **${price}**!\n\n🏆 {winner} guessed ${guess} — closest without going over!"

## Scoring
- **Closest without going over:** 20 points
- **Within 10% of actual price (without going over):** 15 bonus points (on top of the 20)
- **Exact price:** 50 points (replaces other scoring for that round)
- **Closest overall (even if over):** 5 consolation points (only if no one was under)
- **Participation:** 5 points per guess submitted

## Reveal & Scoring
- Post recap table: each product, actual price, all guesses, who won each round
- Crown the overall winner with bonus 15 points
- "Best Instinct" award: player who was closest across all 5 rounds (by total $ difference)

## Notes
- Min 2 players, max 50 (scales great for large groups)
- Low barrier — no special knowledge needed
- Generates lots of discussion ("no way that costs that much!")
- Keep products relatable to your team's demographic
- Avoid controversial pricing (medical, housing, etc.)
