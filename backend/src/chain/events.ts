import { flip10 as flip10Contract } from "./contract.js";
import { Contract } from "ethers";
import Flip10Abi from "../abi/Flip10Sessions.js";
import { addFlips } from "../session/allowance.js";
import { getSession } from "../session/runtime.js";
import { createProvider, getAuthorityWallet } from "./base.js";

let recreating = false;
let flip10 = flip10Contract;
let resubscriptionTimer: NodeJS.Timeout | null = null;
const RESUBSCRIBE_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

// onFlipPurchased handler
const onFlipPurchased = (
  sessionId: bigint,
  buyer: string,
  flips: bigint,
  amountWei: bigint,
  event: any
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
};

function recreateProviderAndContract() {
  if (recreating) {
    console.warn("[EVENTS] Provider recreation already in progress, skipping");
    return;
  }

  recreating = true;

  console.log("[EVENTS] Recreating WS provider + contract");

  try {
    createProvider();

    flip10 = new Contract(
      process.env.CONTRACT_ADDRESS!,
      Flip10Abi,
      getAuthorityWallet()
    );

    flip10.on("FlipPackagePurchased", onFlipPurchased);
  } finally {
    setTimeout(() => {
      recreating = false;
    }, 1_000);
  }
}

function scheduleResubscription() {
  if (resubscriptionTimer) {
    clearInterval(resubscriptionTimer);
  }

  resubscriptionTimer = setInterval(() => {
    console.warn("[EVENTS] Scheduled WS hard reset (4h interval)");
    recreateProviderAndContract();
  }, RESUBSCRIBE_INTERVAL_MS);
}

export function subscribeToFlipPurchases() {
  console.log("[EVENTS] Subscribing to FlipPackagePurchased");

  // Initial boot
  recreateProviderAndContract();

  // Safety resubscription
  scheduleResubscription();
}