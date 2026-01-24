type IpStats = {
  connections: number;
  lastSeen: number;
};

const ipStats = new Map<string, IpStats>();

const MAX_CONNECTIONS_PER_IP = 5;
const IP_TTL_MS = 60_000; // cleanup after 1 min

export function canConnect(ip: string): boolean {
  const now = Date.now();
  const stats = ipStats.get(ip);

  if (!stats) {
    ipStats.set(ip, { connections: 1, lastSeen: now });
    return true;
  }

  stats.lastSeen = now;

  if (stats.connections >= MAX_CONNECTIONS_PER_IP) {
    return false;
  }

  stats.connections += 1;
  return true;
}

export function onDisconnect(ip: string) {
  const stats = ipStats.get(ip);
  if (!stats) return;

  stats.connections = Math.max(0, stats.connections - 1);
  stats.lastSeen = Date.now();
}

export function cleanupIps() {
  const now = Date.now();
  for (const [ip, stats] of ipStats.entries()) {
    if (now - stats.lastSeen > IP_TTL_MS) {
      ipStats.delete(ip);
    }
  }
}