import { create } from 'zustand';

export interface LastFinalizedSession {
    sessionId: number;
    winner: string;
    finalLeaderboard: { address: string; streak: number }[];
    totalFlips: number;
    endedAt: number;
}

export interface SessionData {
    active: boolean;
    id?: number;
    startedAt?: number;
    totalFlips: number;
    headsProbability?: number;
    leaderboard?: LeaderboardEntry[];
    players?: number;
    winner?: string;
    nextSessionStartsAt?: number;
    lastSession?: LastFinalizedSession;
}

export interface LeaderboardEntry {
    address: string;
    streak: number;
    flips: number;
}

export interface PlayerData {
    address: string;
    streak: number;
    remainingFlips: number;
}

interface GameStore {
    isConnected: boolean;
    isAuthenticated: boolean;
    isAuthenticating: boolean;
    authRejected: boolean;
    isFlipping: boolean;
    showBuyModal: boolean;
    showWinModal: boolean;
    session: SessionData | null;
    player: PlayerData | null;
    lastResult: 'heads' | 'tails' | null;
    pendingAuthNonce: string | null;
    pendingAuthAddress: string | null;

    connect: (url?: string) => void;
    disconnect: () => void;
    requestAuth: (address: string) => void;
    verifyAuth: (address: string, signature: string) => void;
    flip: () => void;
    sendHello: (address: string) => void;
    retryAuth: () => void;
    setShowBuyModal: (value: boolean) => void;
    setShowWinModal: (value: boolean) => void;

    // Internal: set pending auth (called from message handler)
    _setPendingAuth: (nonce: string | null, address: string | null) => void;
    _setAuthenticated: (value: boolean) => void;
    _setAuthRejected: (value: boolean) => void;
}

let socket: WebSocket | null = null;

export const useGameStore = create<GameStore>((set, get) => ({
    isConnected: false,
    isAuthenticated: false,
    isAuthenticating: false,
    authRejected: false,
    isFlipping: false,
    showBuyModal: false,
    showWinModal: false,
    session: null,
    player: null,
    lastResult: null,
    pendingAuthNonce: null,
    pendingAuthAddress: null,

    connect: (url = import.meta.env.VITE_BACKEND_URL || 'ws://localhost:3001/ws') => {
        // Prevent double connections
        if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) {
            return;
        }

        // Close existing socket if in closing state
        if (socket) {
            socket.onopen = null;
            socket.onclose = null;
            socket.onmessage = null;
            socket = null;
        }

        socket = new WebSocket(url);

        socket.onopen = () => {
            console.log('WebSocket Connected');
            set({ isConnected: true });
        };

        socket.onclose = () => {
            console.log('WebSocket Disconnected');
            set({ isConnected: false, isAuthenticated: false, isAuthenticating: false, pendingAuthNonce: null, pendingAuthAddress: null });
        };

        socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                const { type, data, streak, probability, remainingFlips, result, nonce } = msg;

                switch (type) {
                    case 'session_snapshot':
                        set({ session: data });
                        break;

                    case 'session_tick':
                        // Preserve leaderboard while flipping to avoid spoiling the result
                        console.log('session_tick', data);
                        if (get().isFlipping) {
                            set((state) => ({
                                session: state.session
                                    ? { ...data, leaderboard: state.session.leaderboard }
                                    : data
                            }));
                        } else {
                            set({ session: data });
                        }
                        break;

                    case 'flip_result': {
                        // Update remainingFlips immediately (doesn't spoil result)
                        set((state) => ({
                            player: state.player ? { ...state.player, remainingFlips } : null,
                        }));

                        // Delay streak, result, probability, and isFlipping until animation completes
                        setTimeout(() => {
                            set((state) => ({
                                isFlipping: false,
                                lastResult: result,
                                player: state.player ? { ...state.player, streak } : null,
                                session: state.session ? { ...state.session, headsProbability: probability } : null
                            }));
                        }, 1050);
                        break;
                    }

                    case 'player_state':
                        // Ignore player_state while flipping to prevent spoiling the result
                        // (the delayed flip_result handler will update the player state)
                        if (!get().isFlipping) {
                            set({ player: { address: msg.address, streak: msg.streak, remainingFlips: msg.remainingFlips } });
                        }
                        break;

                    case 'session_ended': {
                        const currentAddress = get().pendingAuthAddress;
                        const winner = msg.data.winner;
                        // Check if current user won (case-insensitive address comparison)
                        const isWinner = currentAddress && winner &&
                            currentAddress.toLowerCase() === winner.toLowerCase();

                        set((state) => ({
                            session: state.session ? {
                                ...state.session,
                                active: false,
                                winner: msg.data.winner,
                                leaderboard: msg.data.leaderboard,
                                nextSessionStartsAt: msg.data.nextSessionStartsAt
                            } : null,
                            showWinModal: isWinner ? true : state.showWinModal
                        }));
                        break;
                    }

                    case 'auth_challenge':
                        // Backend sent us a nonce to sign
                        console.log('Received auth challenge:', nonce);
                        set({ pendingAuthNonce: nonce });
                        break;

                    case 'auth_ok':
                        console.log('Authentication successful.');
                        set({ isAuthenticated: true, isAuthenticating: false, pendingAuthNonce: null });
                        get().sendHello(get().pendingAuthAddress!);
                        break;

                    case 'auth_failed':
                        console.error('Authentication failed');
                        set({ isAuthenticated: false, isAuthenticating: false, pendingAuthNonce: null, pendingAuthAddress: null });
                        break;

                    case 'error':
                        console.error('WS Error:', msg.reason);
                        break;

                    case 'flip_rejected':
                        console.error('Flip rejected:', msg.reason);
                        set({ isFlipping: false });
                        if (msg.reason === 'no_flips_left') {
                            set({ showBuyModal: true });
                        }
                        break;
                }
            } catch (e) {
                console.error('Failed to parse WS message', e);
            }
        };
    },

    disconnect: () => {
        if (socket) {
            socket.close();
            socket = null;
        }
        set({ isConnected: false, isAuthenticated: false, isAuthenticating: false, authRejected: false, pendingAuthNonce: null, pendingAuthAddress: null, player: null });
    },

    requestAuth: (address: string) => {
        if (socket && socket.readyState === WebSocket.OPEN && !get().isAuthenticating) {
            console.log('Requesting auth for:', address);
            set({ isAuthenticating: true, pendingAuthAddress: address });
            socket.send(JSON.stringify({ type: 'auth_request', address }));
        }
    },

    verifyAuth: (address: string, signature: string) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            console.log('Sending auth verification');
            socket.send(JSON.stringify({ type: 'auth_verify', address, signature }));
        }
    },

    flip: () => {
        const state = get();
        if (socket && socket.readyState === WebSocket.OPEN && state.isAuthenticated) {
            set({ isFlipping: true });
            socket.send(JSON.stringify({ type: 'flip' }));
        } else {
            console.error('Cannot flip: not connected or not authenticated');
        }
    },

    sendHello: (address: string) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'hello', address }));
        }
    },

    retryAuth: () => {
        // Clear rejection flag to allow auth flow to trigger again
        set({ authRejected: false });
    },

    setShowBuyModal: (value) => set({ showBuyModal: value }),
    setShowWinModal: (value) => set({ showWinModal: value }),

    _setPendingAuth: (nonce, address) => set({ pendingAuthNonce: nonce, pendingAuthAddress: address }),
    _setAuthenticated: (value) => set({ isAuthenticated: value, isAuthenticating: false }),
    _setAuthRejected: (value) => set({ authRejected: value, isAuthenticating: false, pendingAuthNonce: null, pendingAuthAddress: null })
}));
