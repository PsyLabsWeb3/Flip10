import crypto from "crypto";
import type { Hub } from "../ws/hub.js";
import { resetAllowance } from "./allowance.js";
import { getNextSessionStart } from "./scheduler.js";
import { headsProbability } from "./probability.js";
import { buildLeaderboard } from "./leaderboard.js";
import { saveSession } from "../persistence/sessionStore.js";
import { startSessionOnChain } from "../chain/startSession.js";
import { keccak256, toUtf8Bytes } from "ethers";

type PlayerState = {
  streak: number;
  lastFlipAt: number;
  flips: number;
};

export type RuntimeSession = {
  id: number;
  startedAt: number;
  finalized: boolean;
  seed: string;
  players: Map<string, PlayerState>;
  totalFlips: number;
};

export type LastFinalizedSession = {
  sessionId: number;
  winner: string;
  finalLeaderboard: {
    address: string;
    streak: number;
  }[];
  totalFlips: number;
  endedAt: number;
};

let lastFinalizedSession: LastFinalizedSession | null = null;

let session: RuntimeSession | null = null;
let hubRef: Hub | null = null;

export function setLastFinalizedSession(
  data: LastFinalizedSession
) {
  lastFinalizedSession = data;
}

export function getLastFinalizedSession() {
  return lastFinalizedSession;
}

export function hasActiveSession(): boolean {
  return !!session && !session.finalized;
}

export function initRuntimeSession(hub: Hub) {
  hubRef = hub;
  startNewSession();
}

export function restoreSessionFromDisk(data: {
  sessionId: number;
  startedAt: number;
  finalized: boolean;
}) {
  resetAllowance();

  session = {
    id: data.sessionId,
    startedAt: data.startedAt,
    finalized: data.finalized,
    seed: crypto.randomUUID(),
    players: new Map(),
    totalFlips: 0
  };
}

export async function startNewSession() {
  resetAllowance();

  session = {
    id: Date.now(),
    startedAt: Date.now(),
    finalized: false,
    seed: crypto.randomUUID(),
    players: new Map(),
    totalFlips: 0
  };
  
  await startSessionOnChain(session.id);

  saveSession({
    sessionId: session.id,
    startedAt: session.startedAt,
    finalized: false
  });

  hubRef?.broadcast({
    type: "session_started",
    data: getPublicSessionSnapshot()
  });
}

export function clearSession() {
  session = null;
}

export function getSession(): RuntimeSession | null {
  return session;
}

export function getPublicSessionSnapshot() {
  if (!session || session.finalized) {
    if (lastFinalizedSession) {
      return {
        active: false,
        lastSession: lastFinalizedSession,
        nextSessionStartsAt: getNextSessionStart(
          Number(process.env.SESSION_START_HOUR)
        )
      };
    }

    return {
      active: false,
      nextSessionStartsAt: getNextSessionStart(
        Number(process.env.SESSION_START_HOUR)
      )
    };
  }

  const p = headsProbability(session.startedAt, session.totalFlips);

  return {
    active: true,
    id: session.id,
    startedAt: session.startedAt,
    totalFlips: session.totalFlips,
    headsProbability: p,
    leaderboard: buildLeaderboard(session),
    finalized: session.finalized,
    players: session.players.size
  };
}

export function computeSessionProofHash() {
  if (!session) {
    console.error("No session to compute proof hash");
    return null;
  }
  if (!lastFinalizedSession) {
    console.error("No finalized session to compute proof hash");
    return null;
  }

  const payload = {
    seed: session.seed,
    sessionId: lastFinalizedSession.sessionId,
    winner: lastFinalizedSession.winner,
    totalFlips: lastFinalizedSession.totalFlips,
    leaderboard: lastFinalizedSession.finalLeaderboard
  };

  return keccak256(
    toUtf8Bytes(JSON.stringify(payload))
  );
}