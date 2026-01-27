import dotenv from "dotenv";
import { getSession } from "../src/session/runtime.js";
import { addFlips } from "../src/session/allowance.js";

dotenv.config();

async function main() {
    const flipsAddress = process.argv[2];
    const flipsCount = Number(process.argv[3]);

    if (!flipsAddress) {
        console.log("[ERROR] Flips address required as argument: npx ts-node scripts/finalize-session.ts <address>");
        process.exit(1);
    }

    const currentSession = getSession();
    if (!currentSession) {
        console.log("[ERROR] No active session");
        process.exit(1);
    }

    console.log("[SCRIPT] Adding session ", currentSession.id, " flips to address", flipsAddress);

    const address = flipsAddress;
    const count = flipsCount || 1;

    addFlips(address, count);

    console.log("[SCRIPT] Added flips successfully");

    process.exit(0);
}

main().catch((err) => {
    console.error("[ERROR]", err);
    process.exit(1);
});
