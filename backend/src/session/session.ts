export type PlayerState = {
  streak: number;
  lastFlipAt: number;
};

export type SessionState = {
  id: number;
  startedAt: number;
  finalized: boolean;
  players: Map<string, PlayerState>;
  totalEthSpent: number;
};

export const session: SessionState = {
  id: Date.now(),
  startedAt: Date.now(),
  finalized: false,
  players: new Map(),
  totalEthSpent: 0
};