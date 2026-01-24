import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";

type WSMessage = {
  type: string;
  [key: string]: unknown;
};

export type Hub = {
  add: (ws: WebSocket) => void;
  remove: (ws: WebSocket) => void;
  broadcast: (msg: WSMessage) => void;
  size: () => number;
};

export function createHub(app: FastifyInstance): Hub {
  const clients = new Set<WebSocket>();

  function safeSend(ws: WebSocket, payload: string) {
    try {
      ws.send(payload);
    } catch {
      clients.delete(ws);
    }
  }

  return {
    add(ws) {
      clients.add(ws);
      app.log.info({ wsClients: clients.size }, "WS client connected");
    },
    remove(ws) {
      clients.delete(ws);
      app.log.info({ wsClients: clients.size }, "WS client disconnected");
    },
    broadcast(msg) {
      const payload = JSON.stringify(msg);
      for (const ws of clients) safeSend(ws, payload);
    },
    size() {
      return clients.size;
    }
  };
}