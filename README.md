# WhatsAxe

A chat-app prototype for playing D&D over chat. Built as a playground to experiment with TDD in a React application.

## What it does

WhatsAxe is a multiplayer chat room with two roles:

- **Dungeon Master** — drives the story by declaring *Actions*, asks players for skill checks and rolls, applies damage and healing.
- **Players** — chat freely between turns, react with their own *Actions* after the DM has set the scene, and roll dice when prompted.

Each player has a character sheet (stats, HP, race, class) stored in Firestore. Authentication is handled via Google Sign-In.

### Game loop

- The DM declares an *Action*. This wipes the previous chat backlog so the table can focus on what's happening.
- Players can only declare an *Action* after the DM has declared one.
- *Chats* are free-form messages and don't drive the game forward.
- Dead players (HP ≤ 0) can no longer act.

### DM commands

The DM types these as *Actions* (prefixed with `/`):

| Command | Syntax | Effect |
| --- | --- | --- |
| `/skillcheck` | `/skillcheck <player> <stat> <DC>` | Asks the player to roll a d20 + stat modifier against a DC. |
| `/hit` | `/hit <player> <hp>` | Deals damage to the target. |
| `/heal` | `/heal <player> <hp>` | Heals the target (capped at maxhp). |
| `/askroll` | `/askroll <player> <die>` | Asks the player to roll an arbitrary die (e.g. `2d6`). |
| `/roll` | `/roll <die>` | The DM rolls dice publicly. |

Players can be targeted by their initials (e.g. `/hit g 5` matches `Gerardo Branzoni`). Errors are shown only to the DM as private messages.

## Stack

- React 18 (create-react-app)
- Firebase: Auth, Firestore, Hosting
- `react-firebase-hooks`, `react-burger-menu`

## Running locally

```bash
npm install
npm start
```

## Tests

The bulk of the game logic is covered by tests in `src/components/GameRoom.test.js` and `src/utils.test.js`. The project was built test-first to explore what TDD feels like in React with Firestore as the backend (mocked at the `react-firebase-hooks` boundary).

```bash
npm test
```

## Deployment

```bash
./deploy-dev.sh    # deploys to whatsaxe-dev
./deploy-prod.sh   # deploys to whatsaxe-78703
```
