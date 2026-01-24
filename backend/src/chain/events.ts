import { flip10 } from "./contract.js";
import { addFlips } from "../session/allowance.js";
import { getSession } from "../session/runtime.js";

export function subscribeToFlipPurchases() {
  flip10.on(
    "FlipPackagePurchased",
    (
      sessionId: bigint,
      buyer: string,
      flips: bigint
    ) => {
      const session = getSession();
      if (!session) return;

      if (BigInt(session.id) !== sessionId) return;

      addFlips(buyer, Number(flips));
      
      console.log(
        `[FLIPS] ${buyer} purchased ${flips} flips for session ${sessionId}`
      );
    }
  );
}