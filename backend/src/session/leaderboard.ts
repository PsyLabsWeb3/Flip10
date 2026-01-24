import type { RuntimeSession } from "./runtime.js"; // or inline if not separated

export function buildLeaderboard(
  session: RuntimeSession,
  limit = 10
) {
  return Array.from(session.players.entries())
    .map(([address, player]) => ({
      address,
      streak: player.streak
    }))
    .filter(e => e.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, limit);
}

export function buildFinalLeaderboard(session: RuntimeSession) {
  return Array.from(session.players.entries())
    .map(([address, player]) => ({
      address,
      streak: player.streak
    }))
    .sort((a, b) => b.streak - a.streak);
}