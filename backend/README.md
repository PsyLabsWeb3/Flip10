# Flip10 Backend

Backend service for **Flip10**, a real time on-chain coin flip roguelike where players compete in shared daily sessions to reach a 10 heads streak and win a pooled prize.

This backend is responsible for:
- Real time gameplay over WebSockets
- Wallet authentication
- Session orchestration (start / finalize)
- Deterministic, provably fair RNG
- Coordinating on-chain actions with the Flip10 smart contract
- Recovering state after restarts

---

## Architecture Overview

**Components**
- Node.js + TypeScript
- Fastify (HTTP + WebSocket)
- Ethers v6
- Base (EVM-compatible chain)
- JSON persistence for crash recovery

**Responsibilities**
- Maintain a single active runtime session
- Broadcast live session state (`session_tick`)
- Validate wallet ownership via signatures
- Execute deterministic coin flips
- Detect winners and finalize sessions on-chain
- Rebuild player allowances from on-chain events after restart

---

## Session Lifecycle

1. **Session Start**
   - Triggered automatically at `SESSION_START_HOUR` (UTC)
   - Backend calls `startSession(sessionId)` on-chain
   - A cryptographically random session seed is generated

2. **Gameplay**
   - Players authenticate via wallet signature
   - Players purchase flip packages on-chain
   - Backend listens to `FlipPackagePurchased` events
   - Each flip is deterministic:
     ```
     keccak256(seed : playerAddress : nonce)
     ```
   - Heads probability increases globally based on session progress (time elapsed + global flips)

3. **Finalization**
   - First player to reach a 10 heads streak wins
   - Backend computes a final session proof hash
   - Backend calls `finalizeSession(sessionId, winner, proofHash)` on-chain
   - Runtime session is cleared
   - Backend broadcasts final leaderboard

---

## Provable Fairness

Flip results are fully deterministic and reproducible.

### Flip RNG
```
keccak256(`${seed}:${player}:${nonce}`)
```

### Session Proof
At finalization, the backend commits a `proofHash` on-chain, derived from:
- Session seed
- Session ID
- Winner address
- Total flips
- Final leaderboard

This allows anyone to:
- Recompute every flip
- Verify streaks
- Verify the winner
- Verify that the backend did not tamper with results

The seed is kept private until after finalization.

---

## WebSocket API

### Connect
```
ws://localhost:3001/ws
```

### Messages (Client → Server)

#### Authenticate
```json
{
  "type": "auth",
  "address": "0x...",
  "signature": "0x..."
}
```

#### Flip
```json
{
  "type": "flip"
}
```

---

### Messages (Server → Client)

#### Session Snapshot
```json
{
  "type": "session_snapshot",
  "data": {
    "active": true,
    "id": 1769243332158,
    "startedAt": 1769243332158,
    "totalFlips": 123,
    "headsProbability": 0.34,
    "leaderboard": [],
    "players": 12
  }
}
```

#### Flip Result
```json
{
  "type": "flip_result",
  "result": "heads",
  "streak": 4,
  "probability": 0.341,
  "remainingFlips": 96
}
```

#### Player State
```json
{
  "type": "player_state",
  "address": "0x...",
  "streak": 4,
  "remainingFlips": 96
}
```

#### Session Ended
```json
{
  "type": "session_ended",
  "data": {
    "sessionId": 1769243332158,
    "winner": "0x...",
    "leaderboard": [],
    "nextSessionStartsAt": 1769323200000
  }
}
```

---

## Environment Variables

Create a `.env` file in `backend/`:

```env
PORT=3001
SESSION_START_HOUR=12
RPC_URL=https://...
CONTRACT_ADDRESS=0x...
AUTHORITY_PRIVATE_KEY=0x...
```

---

## Running Locally

```bash
npm install
npm run dev
```

Test WebSocket connection:
```bash
npx wscat -c ws://localhost:3001/ws
```

---

## Script usage

### Start a session
```bash
node --loader ts-node/esm scripts/start-session.ts
```

### Finalize a session with a winner
```bash
node --loader ts-node/esm scripts/finalize-session.ts 0x1234567890123456789012345678901234567890
```

### Add flips to a user
```bash
node --loader ts-node/esm scripts/add-flips.ts 0x1234567890123456789012345678901234567890 250
```

---

## Crash Recovery

On startup, the backend:
- Restores last active session from disk (if any)
- Replays on-chain `FlipPackagePurchased` events
- Restores player flip balances
- Continues session safely

If no active session exists, the backend waits for the next scheduled start.

---

## License

MIT
