import { flip10 } from "./contract.js";
import { provider } from "./base.js";
import { addFlips } from "../session/allowance.js";

export async function rebuildAllowanceFromChain(
  sessionId: number
) {
  console.log("[RECOVERY] Rebuilding flip allowance from chain");

  const event = flip10.interface.getEvent("FlipPackagePurchased");
  
  if (!event) {
    console.log("[RECOVERY] FlipPackagePurchased event not found");
    return;
  }

  const logs = await provider.getLogs({
    address: flip10.target,
    topics: [
      event.topicHash,
      "0x" + BigInt(sessionId).toString(16).padStart(64, "0")
    ],
    fromBlock: 0,
    toBlock: "latest"
  });

  for (const log of logs) {
    const parsed = flip10.interface.parseLog(log);
    if (!parsed) continue;

    const { buyer, flips } = parsed.args;
    addFlips(buyer, Number(flips));
  }

  console.log("[RECOVERY] Allowance rebuilt");
}