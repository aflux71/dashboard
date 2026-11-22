# Game Master bot: Cliq setup

The bot's Deluge stays thin. It forwards each DM to the **Game Master** Base44 app and shows the reply. Game rules, solo games and scores all live on the server, so changing them never means pasting into Cliq again. This follows the Production Assistant bot's design.

- Server: Base44 app **Game Master**, https://game-master-4673b1ce.base44.app
  - `POST /api/cliq`: called by the bot (key `GM_BOT_KEY`)
  - `GET|POST /api/agent`: called by the Game Master scheduled task (key `GM_AGENT_KEY`)
- Bot: `gamemaster` in Zoho Cliq

## Keys (never paste a key into a chat)

Make two long random strings, e.g. from a password manager. Each key has one job.

| Key | Set it in | Also paste it into |
|-----|-----------|--------------------|
| `GM_BOT_KEY` | Base44 → Game Master app → Settings → Secrets | the bot's Message handler (`PASTE_KEY_HERE`) |
| `GM_AGENT_KEY` | Base44 → Game Master app → Settings → Secrets | the Claude cloud environment "DashBoard", as a **network credential** for host `game-master-4673b1ce.base44.app` (Bearer). The proxy adds it to requests, so no env var holds it. |

The server refuses every request until its key is set (it answers "GM_BOT_KEY is not set").

## Paste into Cliq

Bots & Tools → Bots → Game Master → **Edit Handlers**:

| Handler | File | Key? |
|---------|------|------|
| Welcome handler | `cliq/gamemaster-welcome-handler.dg` | no |
| Message handler | `cliq/gamemaster-message-handler.dg` | yes |
| Participation handler | leave as `return Map();` (stays silent in the channel) | no |

## Test

1. In a DM with the bot, type `play`. You should see the solo games menu.
2. Type `trivia` and answer. A correct answer shows `+5 pts (5/20 solo points today)`.
3. Type `test vote: nobody`. The bot should say "Got it… the Game Master will pick this up on the next check-in."
4. If the reply is "couldn't reach the Game Master server", the URL is wrong or Base44 is down. "error 401" means the key in the handler doesn't match `GM_BOT_KEY`.

## Cloud environment (for the scheduled task)

The "DashBoard" environment holds `GM_AGENT_KEY` as a network credential for `game-master-4673b1ce.base44.app`; saving it also allowed that host. Nothing else is needed: the scheduled task never calls Cliq directly.
