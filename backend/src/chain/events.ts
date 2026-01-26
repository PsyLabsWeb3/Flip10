import { flip10 } from "./contract.js";
import { addFlips } from "../session/allowance.js";
import { getSession } from "../session/runtime.js";

export function subscribeToFlipPurchases() {
  console.log("[WS] Subscribing to FlipPackagePurchased");

  flip10.on(
    "FlipPackagePurchased",
    (
      sessionId: bigint,
      buyer: string,
      flips: bigint,
      amountWei: bigint,
      event
    ) => {
      console.log("[RAW EVENT]", {
        sessionId: sessionId.toString(),
        buyer,
        flips: flips.toString(),
        amountWei: amountWei.toString(),
        tx: event?.transactionHash,
        block: event?.blockNumber
      });

      const session = getSession();

      if (!session) {
        console.warn("[FLIPS] No active session, skipping");
        return;
      }

      if (BigInt(session.id) !== sessionId) {
        console.warn(
          "[FLIPS] Session mismatch",
          session.id,
          sessionId.toString()
        );
        return;
      }

      addFlips(buyer, Number(flips));
      
      console.log(
        `[FLIPS] ${buyer} purchased ${flips} flips for session ${sessionId}`
      );
    }
  );
}