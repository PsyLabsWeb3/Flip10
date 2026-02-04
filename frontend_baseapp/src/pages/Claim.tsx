import React from 'react';
import { useAccount, useConnect, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseAbiItem } from 'viem';
import { Flip10SessionsABI } from '../abis/Flip10Sessions';
import { chainId } from '../wagmi';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

interface WonSession {
    sessionId: bigint;
    endTime: bigint;
    prizePoolWei: bigint;
    claimed: boolean;
}

export const Claim: React.FC = () => {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const publicClient = usePublicClient();
    const { writeContract, isPending, data: txHash } = useWriteContract();
    const [wonSessions, setWonSessions] = React.useState<WonSession[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [claimingSessionId, setClaimingSessionId] = React.useState<bigint | null>(null);

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

    // Scan for SessionFinalized events where winner = address
    React.useEffect(() => {
        if (!address || !publicClient) return;

        const scanForWins = async () => {
            setIsLoading(true);
            try {
                // Only fetch logs from the most recent 50,000 blocks (RPC limit)
                const BLOCK_RANGE = 50000n;
                const latestBlock = await publicClient.getBlockNumber();
                const fromBlock = latestBlock > BLOCK_RANGE ? latestBlock - BLOCK_RANGE : 0n;

                // Get SessionFinalized logs where winner = address
                const finalizedLogs = await publicClient.getLogs({
                    address: CONTRACT_ADDRESS,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    event: parseAbiItem('event SessionFinalized(uint256 indexed sessionId, address indexed winner, uint64 endTime, bytes32 proofHash)') as any,
                    args: { winner: address },
                    fromBlock,
                    toBlock: latestBlock,
                });

                // Get PrizeClaimed logs to check which ones were already claimed
                const claimedLogs = await publicClient.getLogs({
                    address: CONTRACT_ADDRESS,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    event: parseAbiItem('event PrizeClaimed(uint256 indexed sessionId, address indexed winner, uint256 amountWei)') as any,
                    args: { winner: address },
                    fromBlock,
                    toBlock: latestBlock,
                });

                // Type assertion for logs with args
                type FinalizedLogArgs = { sessionId: bigint; winner: string; endTime: bigint; proofHash: string };
                type ClaimedLogArgs = { sessionId: bigint; winner: string; amountWei: bigint };

                const claimedSessionIds = new Set(claimedLogs.map((log) => ((log as unknown as { args: ClaimedLogArgs }).args.sessionId).toString()));

                // For each finalized session, check the current prize pool
                const sessions: WonSession[] = [];
                for (const log of finalizedLogs) {
                    const args = (log as unknown as { args: FinalizedLogArgs }).args;
                    const sessionId = args.sessionId;
                    const endTime = args.endTime;
                    const claimed = claimedSessionIds.has(sessionId.toString());

                    // Read current session data to get prize pool
                    const sessionData = await publicClient.readContract({
                        address: CONTRACT_ADDRESS,
                        abi: Flip10SessionsABI,
                        functionName: 'sessions',
                        args: [sessionId],
                    });

                    const prizePoolWei = sessionData[5];

                    sessions.push({
                        sessionId,
                        endTime,
                        prizePoolWei,
                        claimed: claimed || prizePoolWei === 0n,
                    });
                }

                setWonSessions(sessions.sort((a, b) => Number(b.sessionId - a.sessionId)));
            } catch (error) {
                console.error('Failed to scan for wins:', error);
            } finally {
                setIsLoading(false);
            }
        };

        scanForWins();
    }, [address, publicClient]);

    // Refresh after successful claim
    React.useEffect(() => {
        if (isSuccess && claimingSessionId !== null) {
            setWonSessions((prev) =>
                prev.map((s) => (s.sessionId === claimingSessionId ? { ...s, claimed: true, prizePoolWei: 0n } : s))
            );
            setClaimingSessionId(null);
        }
    }, [isSuccess, claimingSessionId]);

    const handleClaim = (sessionId: bigint) => {
        setClaimingSessionId(sessionId);
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: Flip10SessionsABI,
            functionName: 'claimPrize',
            args: [sessionId],
            chainId,
        });
    };

    const handleConnect = () => {
        const connector = connectors[0];
        if (connector) {
            connect({ connector });
        }
    };

    return (
        <div style={{ padding: '1rem', maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>CLAIM WINNINGS</h2>

            {!isConnected ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '1rem' }}>
                        Connect your wallet to claim past rewards
                    </p>
                    <button onClick={handleConnect}>Connect Wallet</button>
                </div>
            ) : isLoading ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>Scanning for won sessions...</p>
                </div>
            ) : wonSessions.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ color: '#666', fontSize: '1rem' }}>No won sessions found for your address.</p>
                    <p style={{ color: '#999', marginTop: '1rem', fontSize: '0.9rem' }}>Win a game to see it here!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {wonSessions.map((session) => (
                        <div
                            key={session.sessionId.toString()}
                            className="card"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '0.75rem',
                                padding: '1rem',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                    Session #{session.sessionId.toString()}
                                </div>
                                <div style={{ color: '#666', fontSize: '0.8rem' }}>
                                    Ended: {new Date(Number(session.endTime) * 1000).toLocaleDateString()}
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                {session.claimed ? (
                                    <span
                                        className="badge success"
                                        style={{ fontSize: '0.9rem', padding: '0.4rem 0.75rem' }}
                                    >
                                        ✓ CLAIMED
                                    </span>
                                ) : (
                                    <>
                                        <div style={{ marginBottom: '0.5rem', fontWeight: 700 }}>
                                            {formatEther(session.prizePoolWei)} ETH
                                        </div>
                                        <button
                                            onClick={() => handleClaim(session.sessionId)}
                                            disabled={isPending || isConfirming}
                                            style={{ background: 'var(--color-success)', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                                        >
                                            {isPending && claimingSessionId === session.sessionId
                                                ? 'Confirm...'
                                                : isConfirming && claimingSessionId === session.sessionId
                                                    ? 'Claiming...'
                                                    : 'Claim Prize'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#666' }}>
                <p>This page scans the blockchain for sessions you've won. <br /><br />It will only show sessions from the last 50,000 blocks (~1 day).</p>
            </div>
        </div>
    );
};
