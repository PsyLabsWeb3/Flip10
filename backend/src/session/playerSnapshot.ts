import { getFlips } from "./allowance.js";

export function buildPlayerSnapshot(
  address: string,
  player: {
    streak: number;
    lastFlipAt: number;
  }
) {
  const now = Date.now();

  return {
    streak: player.streak,
    remainingFlips: getFlips(address),
    cooldownMs: Math.max(0, 1000 - (now - player.lastFlipAt))
  };
}