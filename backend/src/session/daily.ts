import { hasActiveSession, startNewSession } from "./runtime.js";
import { getTodaySessionStart } from "./scheduler.js";

const SESSION_START_HOUR = Number(process.env.SESSION_START_HOUR);

if (Number.isNaN(SESSION_START_HOUR)) {
  throw new Error("SESSION_START_HOUR not set");
}

export function startDailySessionWatcher() {
  // Check every 60 seconds
  setInterval(() => {
    const now = Date.now();
    const todayStart = getTodaySessionStart(SESSION_START_HOUR);

    // Too early
    if (now < todayStart) return;

    // Session already running
    if (hasActiveSession()) return;

    // Start session
    console.log("[SESSION] Starting daily session");
    startNewSession();
  }, 60_000);
}