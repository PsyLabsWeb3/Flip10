import dotenv from "dotenv";
import { hasActiveSession, startNewSession } from "../src/session/runtime.js";

dotenv.config();

async function main() {
    if (hasActiveSession()) {
        console.log("[ERROR] Session already active");
        process.exit(1);
    }

    console.log("[SCRIPT] Starting new session");
    startNewSession();
    console.log("[SCRIPT] Session started successfully");
}

main().catch((err) => {
    console.error("[ERROR]", err);
    process.exit(1);
});
