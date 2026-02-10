import Fastify, { type FastifyInstance } from "fastify";
import websocket from "@fastify/websocket";
import dotenv from "dotenv";
import { createHub } from "./ws/hub.js";
import { getPublicSessionSnapshot, getSession } from "./session/runtime.js";
import type { WebSocket } from "ws";
import { performFlip } from "./session/flip.js";
import { headsProbability } from "./session/probability.js";
import { subscribeToFlipPurchases } from "./chain/events.js";
import { getFlips, useFlip } from "./session/allowance.js";
import { startDailySessionWatcher } from "./session/daily.js";
import { startSessionTicker } from "./session/tick.js";
import { buildPlayerSnapshot } from "./session/playerSnapshot.js";
import { getNextSessionStart } from "./session/scheduler.js";
import { setLastFinalizedSession } from "./session/runtime.js";
import { clearSession, loadSession, saveSession } from "./persistence/sessionStore.js";
import { restoreSessionFromDisk } from "./session/runtime.js";
import { rebuildAllowanceFromChain } from "./chain/rebuildAllowance.js";
import { canConnect, onDisconnect } from "./ws/limits.js";
import crypto from "crypto";
import { verifyMessage, Contract, hashMessage } from "ethers";
import { buildFinalLeaderboard } from "./session/leaderboard.js";
import { finalizeSessionOnChain } from "./chain/finalizeSession.js";
import { getProvider } from "./chain/base.js";

const EIP1271_MAGIC_VALUE = "0x1626ba7e";
const EIP6492_VERIFIER_ADDRESS = "0x0000000000000000000000000000000000006492";
const EIP1271_ABI = [
  "function isValidSignature(bytes32 hash, bytes signature) view returns (bytes4)"
];
const EIP6492_ABI = [
  "function isValidSignature(address signer, bytes32 hash, bytes signature) view returns (bytes4)"
];

dotenv.config();

export async function buildServer(): Promise<FastifyInstance> {
    const app = Fastify({
        logger: true
    });

    // WebSocket plugin
    await app.register(websocket);

    const hub = createHub(app);

    // Restore active session from disk if exists
    const persisted = loadSession();

    if (persisted && !persisted.finalized) {
        console.log("[SESSION] Restoring active session from disk");
        restoreSessionFromDisk(persisted);

        await rebuildAllowanceFromChain(persisted.sessionId);
    }

    // Start daily session watcher
    startDailySessionWatcher();

    // Start session ticker
    startSessionTicker(hub);

    // Subscribe to blockchain flip purchase events
    subscribeToFlipPurchases();

    // ---- HTTP routes ----

    app.get("/health", async () => {
        return { ok: true, ts: Date.now() };
    });

    app.get("/session", async () => {
        return getPublicSessionSnapshot();
    });

    // ---- WebSocket route ----
    // Connect: ws://localhost:3001/ws
    app.get("/ws", { websocket: true }, (connection, req) => {
        const ws = connection as WebSocket;

        const ip =
            req.headers["x-forwarded-for"]?.toString().split(",")[0] ??
            req.socket.remoteAddress ??
            "unknown";

        if (!canConnect(ip)) {
            ws.close(1008, "Too many connections from this IP");
            return;
        }

        hub.add(ws);

        let authenticated = false;
        let authedAddress: string | null = null;
        let authNonce: string | null = null;

        let messageCount = 0;
        let windowStart = Date.now();

        const MAX_MESSAGES_PER_SECOND = 20;

        ws.send(
            JSON.stringify({
                type: "session_snapshot",
                data: getPublicSessionSnapshot()
            })
        );

        ws.on("message", async (raw: Buffer | string) => {
            const now = Date.now();
            if (now - windowStart > 1000) {
                windowStart = now;
                messageCount = 0;
            }

            messageCount += 1;

            if (messageCount > MAX_MESSAGES_PER_SECOND) {
                ws.send(JSON.stringify({
                    type: "error",
                    reason: "rate_limited"
                }));
                return;
            }

            try {
                const text = typeof raw === "string" ? raw : raw.toString("utf8");
                const msg = JSON.parse(text);

                if (msg?.type === "auth_request") {
                    const address = msg.address as string;
                    if (!address) return;

                    authNonce = `flip10:${Date.now()}:${crypto.randomBytes(16).toString("hex")}`;

                    ws.send(JSON.stringify({
                        type: "auth_challenge",
                        nonce: authNonce
                    }));

                    return;
                }

                if (msg?.type === "auth_verify") {
                    console.log(msg);
                    const { address, signature } = msg;

                    if (!authNonce || !address || !signature) {
                        ws.send(JSON.stringify({ type: "auth_failed" }));
                        return;
                    }

                    try {
                        const isEOASignature =
                            typeof signature === "string" &&
                            signature.startsWith("0x") &&
                            signature.length === 132;

                        let verified = false;

                        if (isEOASignature) {
                            // EOA signature verification
                            console.log("Verifying EOA signature for address:", address);
                            const recovered = verifyMessage(authNonce, signature);
                            verified = recovered.toLowerCase() === address.toLowerCase();
                        } else {
                            // Smart wallet signature verification
                            console.log("Verifying smart wallet signature for address:", address);
                            const messageHash = hashMessage(authNonce);

                            const wallet = new Contract(
                                address,
                                EIP1271_ABI,
                                getProvider()
                            );

                            try {
                                // Primary: EIP-1271 (deployed wallet)
                                const result = await wallet.isValidSignature(messageHash, signature);
                                verified = result.toLowerCase() === EIP1271_MAGIC_VALUE;
                            } catch (err) {
                                // Fallback: EIP-6492 (counterfactual wallet)
                                console.log(
                                    "EIP-1271 failed, attempting EIP-6492 verification for address:",
                                    address
                                );

                                const verifier = new Contract(
                                    EIP6492_VERIFIER_ADDRESS,
                                    EIP6492_ABI,
                                    getProvider()
                                );

                                const result = await verifier.isValidSignature(
                                    address,
                                    messageHash,
                                    signature
                                );

                                verified = result.toLowerCase() === EIP1271_MAGIC_VALUE;
                            }
                        }

                        if (!verified) {
                            console.log("Authentication failed for address:", address);
                            ws.send(JSON.stringify({ type: "auth_failed" }));
                            return;
                        }

                        authenticated = true;
                        authedAddress = address;

                        console.log("Authentication succeeded for address:", address);
                        ws.send(JSON.stringify({ type: "auth_ok" }));

                        const session = getSession();
                        if (session) {
                            const player = session.players.get(address);
                            if (player) {
                                ws.send(JSON.stringify({
                                    type: "player_state",
                                    ...buildPlayerSnapshot(address, player)
                                }));
                            }
                        }
                    } catch (err) {
                        console.error("Auth verify error:", err);
                        ws.send(JSON.stringify({ type: "auth_failed" }));
                    }

                    return;
                }

                if (msg?.type === "hello") {
                    const address = msg.address as string;
                    const currentSession = getSession();

                    if (!address || !currentSession) return;

                    const player = currentSession.players.get(address);

                    if (player) {
                        ws.send(JSON.stringify({
                            type: "player_state",
                            ...buildPlayerSnapshot(address, player)
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: "player_state",
                            streak: 0,
                            remainingFlips: getFlips(address),
                            cooldownMs: 0
                        }));
                    }

                    return;
                }

                if (msg?.type === "flip") {
                    if (!authenticated || !authedAddress) {
                        ws.send(JSON.stringify({
                            type: "flip_rejected",
                            reason: "unauthenticated"
                        }));
                        return;
                    }

                    const address = authedAddress;
                    const currentSession = getSession();

                    if (!address || !currentSession || currentSession.finalized) return;

                    if (getFlips(address) <= 0) {
                        ws.send(JSON.stringify({
                            type: "flip_rejected",
                            reason: "no_flips_left"
                        }));
                        return;
                    }

                    const now = Date.now();
                    const player =
                        currentSession.players.get(address) ??
                        { streak: 0, lastFlipAt: 0, flips: 0 };

                    if (now - player.lastFlipAt < 1000) {
                        ws.send(JSON.stringify({
                            type: "flip_rejected",
                            reason: "rate_limited"
                        }));
                        return;
                    }

                    currentSession.totalFlips += 1;
                    useFlip(address);

                    const p = headsProbability(currentSession.startedAt, currentSession.totalFlips);
                    const result = performFlip(
                        currentSession.seed,
                        address,
                        player.flips,
                        p
                    );

                    player.lastFlipAt = now;
                    player.flips += 1;
                    player.streak = result ? player.streak + 1 : 0;

                    currentSession.players.set(address, player);

                    console.log(`[FLIP] Player ${address} flipped ${result ? "heads" : "tails"} (streak: ${player.streak}, p=${(p * 100).toFixed(2)}%)`);
                    ws.send(JSON.stringify({
                        type: "flip_result",
                        result: result ? "heads" : "tails",
                        streak: player.streak,
                        probability: p,
                        remainingFlips: getFlips(address)
                    }));

                    ws.send(JSON.stringify({
                        type: "player_state",
                        ...buildPlayerSnapshot(address, player)
                    }));

                    // Winner detection
                    if (player.streak >= 10) {
                        console.log(`[SESSION] Player ${address} achieved 10 heads streak, finalizing session ${currentSession.id}`);
                        currentSession.finalized = true;

                        const finalLeaderboard = buildFinalLeaderboard(currentSession);

                        const finalized = {
                            sessionId: currentSession.id,
                            winner: address,
                            finalLeaderboard,
                            totalFlips: currentSession.totalFlips,
                            endedAt: Date.now()
                        };

                        setLastFinalizedSession(finalized);

                        finalizeSessionOnChain(currentSession.id, address)
                            .catch((err: unknown) => {
                                console.error("[CHAIN] Finalize failed", err);
                            });

                        saveSession({
                            sessionId: currentSession.id,
                            startedAt: currentSession.startedAt,
                            finalized: true
                        });

                        hub.broadcast({
                            type: "session_ended",
                            data: {
                                ...finalized,
                                nextSessionStartsAt: getNextSessionStart(
                                    Number(process.env.SESSION_START_HOUR)
                                )
                            }
                        });

                        clearSession();
                    }

                    return;
                }
            } catch {
                // ignore malformed input
            }
        });

        ws.on("close", () => {
            hub.remove(ws);
            onDisconnect(ip);
        });
    });

    return app;
}