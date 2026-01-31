import { useEffect, useRef } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useGameStore } from '../store/useGameStore';

/**
 * Hook that handles the WebSocket authentication flow:
 * 1. When WS is connected AND wallet is connected -> send auth_request
 * 2. When auth_challenge is received -> sign nonce with wallet
 * 3. Send auth_verify with signature
 * 4. When wallet disconnects -> reset WS connection
 * 5. If user rejects signing -> stop retrying until they try to flip
 */
export function useAuthFlow() {
    const { address, isConnected: isWalletConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const authAttemptedRef = useRef<string | null>(null);
    const previousAddressRef = useRef<string | undefined>(undefined);

    const isConnected = useGameStore((s) => s.isConnected);
    const isAuthenticated = useGameStore((s) => s.isAuthenticated);
    const isAuthenticating = useGameStore((s) => s.isAuthenticating);
    const authRejected = useGameStore((s) => s.authRejected);
    const pendingAuthNonce = useGameStore((s) => s.pendingAuthNonce);
    const pendingAuthAddress = useGameStore((s) => s.pendingAuthAddress);
    const requestAuth = useGameStore((s) => s.requestAuth);
    const verifyAuth = useGameStore((s) => s.verifyAuth);
    const disconnect = useGameStore((s) => s.disconnect);
    const connect = useGameStore((s) => s.connect);

    // Handle wallet disconnection - reset WS connection
    useEffect(() => {
        const wasConnected = previousAddressRef.current !== undefined;
        const isNowDisconnected = !isWalletConnected || !address;

        // Wallet was connected and is now disconnected
        if (wasConnected && isNowDisconnected) {
            console.log('Wallet disconnected, resetting WS connection');
            authAttemptedRef.current = null;
            // Disconnect and reconnect WS to reset auth state on backend
            disconnect();
            // Reconnect after a short delay
            setTimeout(() => {
                connect();
            }, 100);
        }

        previousAddressRef.current = address;
    }, [isWalletConnected, address, disconnect, connect]);

    // Reset auth attempted when WS reconnects
    const prevIsConnectedRef = useRef(false);
    useEffect(() => {
        // WS just connected (was false, now true)
        if (isConnected && !prevIsConnectedRef.current) {
            authAttemptedRef.current = null;
        }
        prevIsConnectedRef.current = isConnected;
    }, [isConnected]);

    // Connect WS on mount
    useEffect(() => {
        if (!isConnected) {
            console.log('App mounted, connecting to WS...');
            connect();
        }
    }, [connect, isConnected]);

    // Trigger auth request when both WS and wallet are connected
    useEffect(() => {
        // All conditions must be met
        if (!isConnected || !isWalletConnected || !address) {
            return;
        }

        // Don't re-auth if already authenticated or in progress
        if (isAuthenticated || isAuthenticating) {
            return;
        }

        // Don't retry if user previously rejected
        if (authRejected) {
            return;
        }

        // Prevent duplicate auth attempts for the same address
        if (authAttemptedRef.current === address) {
            return;
        }

        console.log('Auth conditions met, requesting auth for:', address);
        authAttemptedRef.current = address;
        requestAuth(address);
    }, [isConnected, isWalletConnected, address, isAuthenticated, isAuthenticating, authRejected, requestAuth]);

    // Sign the nonce when auth_challenge is received
    useEffect(() => {
        if (!pendingAuthNonce || !pendingAuthAddress) {
            return;
        }

        const signAndVerify = async () => {
            try {
                console.log('Signing nonce:', pendingAuthNonce);
                const signature = await signMessageAsync({ message: pendingAuthNonce });
                console.log('Signature obtained, verifying...');
                verifyAuth(pendingAuthAddress, signature);
            } catch (error) {
                console.error('User rejected signing or error occurred:', error);
                // Mark as rejected so we don't auto-retry
                authAttemptedRef.current = null;
                useGameStore.getState()._setAuthRejected(true);
            }
        };

        signAndVerify();
    }, [pendingAuthNonce, pendingAuthAddress, signMessageAsync, verifyAuth]);

    return { isAuthenticated, isAuthenticating, authRejected };
}
