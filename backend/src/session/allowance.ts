let allowance = new Map<string, number>();

export function resetAllowance() {
  allowance = new Map();
}

export function addFlips(address: string, flips: number) {
  allowance.set(address, (allowance.get(address) ?? 0) + flips);
}

export function getFlips(address: string): number {
  return allowance.get(address) ?? 0;
}

export function useFlip(address: string) {
  const current = allowance.get(address) ?? 0;
  if (current <= 0) throw new Error("NO_FLIPS_LEFT");
  allowance.set(address, current - 1);
}