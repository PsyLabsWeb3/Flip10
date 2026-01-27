import dotenv from "dotenv";
import { getSession, clearSession, setLastFinalizedSession } from "../src/session/runtime.js";
import { buildFinalLeaderboard } from "../src/session/leaderboard.js";
import { saveSession } from "../src/persistence/sessionStore.js";
import { finalizeSessionOnChain } from "../src/chain/finalizeSession.js";
import { getNextSessionStart } from "../src/session/scheduler.js";

dotenv.config();

async function main() {
    const winnerAddress = process.argv[2];

    if (!winnerAddress) {
        console.log("[ERROR] Winner address required as argument: npx ts-node scripts/finalize-session.ts <address>");
        process.exit(1);
    }

    const currentSession = getSession();
    if (!currentSession) {
        console.log("[ERROR] No active session");
        process.exit(1);
    }

    console.log("[SCRIPT] Finalizing session", currentSession.id, "with winner", winnerAddress);

    currentSession.finalized = true;
    const address = winnerAddress;

    const finalLeaderboard = buildFinalLeaderboard(currentSession);

    const finalized = {
        sessionId: currentSession.id,
        winner: address,
        finalLeaderboard,
        totalFlips: currentSession.totalFlips,
        endedAt: Date.now()
    };

    setLastFinalizedSession(finalized);

    try {
        await finalizeSessionOnChain(currentSession.id, address);
    } catch (err: unknown) {
        console.error("[CHAIN] Finalize failed", err);
        process.exit(1);
    }

    saveSession({
        sessionId: currentSession.id,
        startedAt: currentSession.startedAt,
        finalized: true
    });

    clearSession();

    const nextSessionStart = getNextSessionStart(Number(process.env.SESSION_START_HOUR));
    console.log("[SCRIPT] Session finalized successfully");
    console.log("[SCRIPT] Next session starts at:", new Date(nextSessionStart).toISOString());

    process.exit(0);
}

main().catch((err) => {
    console.error("[ERROR]", err);
    process.exit(1);
});
