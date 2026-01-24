import { buildServer } from "./server.js";
import { cleanupIps } from "./ws/limits.js";

const app = await buildServer();
setInterval(cleanupIps, 30_000);

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

await app.listen({ port, host });
app.log.info(`Flip10 backend listening on http://${host}:${port}`);