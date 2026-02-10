import { Contract } from "ethers";
import { getAuthorityWallet } from "./base.js";
import Flip10Abi from "../abi/Flip10Sessions.js";

export const flip10 = new Contract(
  process.env.CONTRACT_ADDRESS!,
  Flip10Abi,
  getAuthorityWallet()
);