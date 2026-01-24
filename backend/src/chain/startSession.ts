import { flip10 } from "./contract.js";

export async function startSessionOnChain(sessionId: number) {
  console.log("[CHAIN] Starting session on-chain", sessionId);

  try {
    const tx = await flip10.startSession(sessionId);
    await tx.wait();

    console.log("[CHAIN] Session started on-chain");
  } catch (err: any) {
    // Ignore if already started
    if (err?.reason?.includes("SessionAlreadyStarted")) {
      console.log("[CHAIN] Session already started, ignoring");
      return;
    }
    throw err;
  }
}