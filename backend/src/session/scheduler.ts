export function getTodaySessionStart(hourUTC: number): number {
  const now = new Date();

  const start = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    hourUTC,
    0,
    0,
    0
  ));

  return start.getTime();
}

export function getNextSessionStart(hourUTC: number): number {
  const now = Date.now();
  const todayStart = getTodaySessionStart(hourUTC);

  if (now < todayStart) return todayStart;

  return todayStart + 24 * 60 * 60 * 1000;
}