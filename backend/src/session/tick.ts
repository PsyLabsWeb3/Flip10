import type { Hub } from "../ws/hub.js";
import { getPublicSessionSnapshot } from "./runtime.js";

export function startSessionTicker(hub: Hub) {
  setInterval(() => {
    hub.broadcast({
      type: "session_tick",
      data: getPublicSessionSnapshot()
    });
  }, 1000);
}