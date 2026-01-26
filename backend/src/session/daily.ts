import { hasActiveSession, startNewSession } from "./runtime.js";
import { getTodaySessionStart } from "./scheduler.js";

const SESSION_START_HOUR = Number(process.env.SESSION_START_HOUR);

if (Number.isNaN(SESSION_START_HOUR)) {
  throw new Error("SESSION_START_HOUR not set");
}

export function startDailySessionWatcher() {
  function scheduleNextCheck() {
    const now = Date.now();
    let nextCheckTime = getTodaySessionStart(SESSION_START_HOUR);

    // If today's session start time has passed, schedule for tomorrow
    if (now >= nextCheckTime) {
      nextCheckTime += 24 * 60 * 60 * 1000;
    }

    const delayMs = nextCheckTime - now;

    setTimeout(() => {
      // Only start session if one isn't already running
      if (!hasActiveSession()) {
        console.log("[SESSION] Starting daily session");
        startNewSession();
      }

      // Schedule the next check for tomorrow
      scheduleNextCheck();
    }, delayMs);
  }

  scheduleNextCheck();
}