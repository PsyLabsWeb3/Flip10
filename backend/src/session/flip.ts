import { keccak256, toUtf8Bytes } from "ethers";

export function performFlip(
  seed: string,
  player: string,
  nonce: number,
  probability: number
): boolean {
  const hash = keccak256(
    toUtf8Bytes(`${seed}:${player}:${nonce}`)
  );

  const roll = Number(BigInt(hash) % 10_000n);
  const threshold = Math.floor(probability * 10_000);

  return roll < threshold;
}