# Flip10 Smart Contracts

This directory contains the Ethereum smart contracts for **Flip10**, a multiplayer coin flip game deployed on **Base**.

The contracts are responsible for **funds, session lifecycle and settlement**.  
All real time gameplay (coin flips, streaks, cooldowns, probability evolution) is handled off-chain by the Flip10 game engine.

---

## Design Principles

- **No per-flip transactions**  
  Flips happen off-chain to ensure low latency and good UX.

- **On-chain escrow & settlement only**  
  Contracts handle payments, prize pools, and payouts.

- **Claim-based payouts**  
  Winners explicitly claim prizes to avoid gas edge cases.

- **Backend is not trusted with funds**  
  The backend can finalize sessions but cannot withdraw or redirect funds.

- **Provably fair hooks**  
  Session finalization includes a proof hash that can be used to verify off-chain gameplay deterministically.

---

## Core Contract

### `Flip10Sessions.sol`

This is the main escrow and settlement contract.

#### Functionality
- Start daily sessions
- Sell flip packages (ETH)
- Split revenue between prize pool and treasury
- Finalize a session with a winner
- Allow the winner to claim the prize

---

## Session Lifecycle

1. **Session Start**
   - An authorized operator starts a session with a unique `sessionId`.

2. **Flip Package Purchases**
   - Players buy flip packages by sending ETH.
   - A fixed percentage goes to the prize pool.
   - The remainder is sent directly to the treasury.

3. **Gameplay (Off-Chain)**
   - Players flip once per second.
   - Heads probability evolves globally over time.
   - The first player to reach a 10 heads streak wins.

4. **Session Finalization**
   - The backend finalizes the session on-chain with:
     - the winner address
     - a `proofHash` committing to the off-chain session log

5. **Prize Claim**
   - The winner claims the prize from the contract.

---

## Roles

### Owner
- Sets operators
- Sets treasury address
- Sets prize split (BPS)
- Configures finalize safety parameters

### Operator (Backend)
- Starts sessions
- Finalizes sessions

### Players
- Buy flip packages
- Claim prizes if they win

---

## Prize Split

Flip package payments are split deterministically:

- `prizeBps` → Prize Pool
- `10000 - prizeBps` → Treasury

Example:

prizeBps = 8000 (80%)

1 ETH payment:

- 0.80 ETH → prize pool
- 0.20 ETH → treasury

---

## Provable Fairness

The contract supports a `proofHash` on session finalization.

Expected usage:
- Backend commits a session seed hash at session start
- All flips are derived deterministically from the seed
- At session end, the seed + logs are revealed
- Anyone can replay and verify the session off-chain

---

## Tech Stack

- Solidity `^0.8.24`
- Foundry (Forge)
- OpenZeppelin Contracts
- Base (EVM L2)

---

## Development

### Install dependencies
```bash
forge install
```

### Run tests
```bash
forge test -vv
```

---

## License

MIT

---