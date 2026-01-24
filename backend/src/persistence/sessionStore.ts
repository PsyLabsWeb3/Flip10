import fs from "fs";
import path from "path";

const STORE_PATH = path.resolve(
  process.cwd(),
  "data",
  "session.json"
);

export type PersistedSession = {
  sessionId: number;
  startedAt: number;
  finalized: boolean;
};

function ensureDir() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function saveSession(session: PersistedSession) {
  ensureDir();
  fs.writeFileSync(
    STORE_PATH,
    JSON.stringify(session, null, 2),
    "utf-8"
  );
}

export function loadSession(): PersistedSession | null {
  if (!fs.existsSync(STORE_PATH)) return null;

  try {
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (fs.existsSync(STORE_PATH)) {
    fs.unlinkSync(STORE_PATH);
  }
}