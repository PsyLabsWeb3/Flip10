const BASE = Number(process.env.BASE) || 30;              // 30%
const TIME_RATE = Number(process.env.TIME_RATE) || 0.05;  // +0.05% per minute
const FLIP_RATE = Number(process.env.FLIP_RATE) || 0.002; // +0.002% per flip (200 flips = +0.4%)

export function headsProbability(
  startedAt: number,
  totalFlips: number
): number {
  const minutes = (Date.now() - startedAt) / 60000;

  const timeBonus = minutes * TIME_RATE;
  const flipBonus = totalFlips * FLIP_RATE;

  const p = BASE + timeBonus + flipBonus;

  return Math.min(p, 60) / 100;
}