import { WebSocketProvider, Wallet } from "ethers";
import dotenv from "dotenv";

dotenv.config();

export const provider = new WebSocketProvider(
  process.env.RPC_WS_URL!
);

export const authorityWallet = new Wallet(
  process.env.AUTHORITY_PRIVATE_KEY!,
  provider
);