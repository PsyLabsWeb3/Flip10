import { WebSocketProvider, Wallet } from "ethers";
import dotenv from "dotenv";

dotenv.config();

let provider: WebSocketProvider;
let authorityWallet: Wallet;

export function createProvider() {
  if (provider) {
    try {
      provider.destroy();
    } catch {}
  }

  provider = new WebSocketProvider(process.env.RPC_WS_URL!);
  authorityWallet = new Wallet(
    process.env.AUTHORITY_PRIVATE_KEY!,
    provider
  );

  console.log("[PROVIDER] New WebSocketProvider created");
}

export function getProvider() {
  return provider;
}

export function getAuthorityWallet() {
  return authorityWallet;
}

createProvider();