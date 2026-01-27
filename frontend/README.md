# Flip10 Frontend

Web client for **Flip10**, a real time on-chain coin flip roguelike where players compete in shared daily sessions to reach a 10 heads streak and win a pooled prize.

This frontend is responsible for:

- Real time game UX
- Wallet connection and authentication
- WebSocket communication with the backend
- Purchasing flip packages on-chain
- Displaying live session state and leaderboard
- Prize claiming

---

## Tech Stack

- **React 18** + TypeScript
- **Vite** (bundler)
- **wagmi** + **viem** (Web3 wallet integration)
- **Three.js** + **React Three Fiber** (3D coin scene)
- **Zustand** (state management)
- **React Router** (routing)

---

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── BuyFlipsModal.tsx    # Purchase flip packages
│   │   ├── Celebration.tsx      # Winner confetti & effects
│   │   ├── CoinScene.tsx        # 3D animated coin
│   │   ├── Countdown.tsx        # Session countdown timer
│   │   ├── Header.tsx           # Top navigation bar
│   │   ├── HowToPlayModal.tsx   # Game instructions
│   │   ├── Layout.tsx           # Page layout wrapper
│   │   ├── Leaderboard.tsx      # Live player rankings
│   │   ├── Tooltip.tsx          # Info tooltips
│   │   └── WinModal.tsx         # Winner announcement
│   │
│   ├── pages/
│   │   ├── Home.tsx             # Main gameplay screen
│   │   └── Claim.tsx            # Prize claim screen
│   │
│   ├── hooks/            # Custom React hooks
│   ├── store/            # Zustand state stores
│   ├── utils/            # Helper utilities
│   ├── abis/             # Contract ABIs
│   │
│   ├── App.tsx           # Root app component
│   ├── main.tsx          # Entry point
│   ├── wagmi.ts          # Wallet configuration
│   └── index.css         # Global styles
│
├── public/               # Static assets (sounds, images)
└── index.html            # HTML entry
```

---

## Key Features

### 3D Coin Flip Animation
The coin flip is rendered using Three.js with physics based animation. The coin state is driven by WebSocket events from the backend.

### Real Time Session State
- Live heads probability display
- Active player count
- Global flip counter
- Leaderboard with streak rankings

### Wallet Integration
- Uses wagmi v2 with viem
- Supports ConnectKit for wallet selection
- Signs authentication messages for backend
- Sends flip package purchase transactions

### Session Modes
- **Active Session**: Full gameplay with flip button, stats, and leaderboard
- **Waiting Mode**: Countdown to next session with previous session stats

---

## Environment Variables

Create a `.env` file in `frontend/`:

```env
VITE_WS_URL=ws://localhost:3001/ws
VITE_CONTRACT_ADDRESS=0x...
VITE_WALLETCONNECT_PROJECT_ID=...
VITE_NETWORK=...
```

---

## Running Locally

### Install dependencies
```bash
npm install
```

### Start dev server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for production
```bash
npm run build
```

---

## WebSocket Connection

The frontend connects to the backend WebSocket server and handles the following message types:

### Incoming Messages
- `session_snapshot` — Full session state update
- `flip_result` — Result of player's flip
- `player_state` — Updated player state
- `session_ended` — Session finalization with winner
- `error` — Error messages

### Outgoing Messages
- `auth` — Wallet authentication with signature
- `flip` — Request to flip the coin

---

## License

MIT
