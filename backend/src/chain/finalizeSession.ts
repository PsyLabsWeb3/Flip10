import { computeSessionProofHash } from "../session/runtime.js";
import { flip10 } from "./contract.js";

export async function finalizeSessionOnChain(
  sessionId: number,
  winner: string
) {
  console.log("[CHAIN] Finalizing session on-chain", sessionId, winner);

  try {
    const proofHash = computeSessionProofHash();
    if(!proofHash) {
      throw new Error("[CHAIN] Cannot compute proof hash for session finalization");
    }

    const tx = await flip10.finalizeSession(sessionId, winner, proofHash);
    await tx.wait();

    console.log("[CHAIN] Session finalized on-chain");
  } catch (err: any) {
    // Ignore if already finalized
    if (err?.reason?.includes("SessionAlreadyFinalized")) {
      console.log("[CHAIN] Session already finalized, ignoring");
      return;
    }
    throw err;
  }
}