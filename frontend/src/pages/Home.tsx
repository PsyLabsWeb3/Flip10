import React, { useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useGameStore } from '../store/useGameStore';
import { CoinScene } from '../components/CoinScene';
import { Leaderboard } from '../components/Leaderboard';
import { BuyFlipsModal } from '../components/BuyFlipsModal';
import { Tooltip, ElapsedTimeTooltip } from '../components/Tooltip';
import { playButtonPress, playButtonRelease, playFlip } from '../utils/sfx';

export const Home: React.FC = () => {
    const { isConnected: isWalletConnected } = useAccount();
    const { connect: connectWallet } = useConnect();
    const { connect, isConnected, session, flip, isFlipping, player, isAuthenticated, authRejected, retryAuth, showBuyModal, setShowBuyModal } = useGameStore();

    useEffect(() => {
        connect();
    }, [connect]);

    // Determine if session is active
    const isSessionActive = session?.active ?? false;
    const hasLastSession = !isSessionActive && session?.lastSession;

    const statBoxStyle = {
        padding: '0.75rem 1rem',
        border: 'var(--border-brutal)',
        boxShadow: 'var(--shadow-brutal)'
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '1rem',
            height: 'calc(100vh - 200px)',
            boxSizing: 'border-box',
            gap: '0.75rem'
        }}>
            {/* Three Column Layout */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                flex: 1,
                minHeight: 0
            }}>
                {/* Left Column - Session Info */}
                <div style={{
                    width: '240px',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: isSessionActive ? 'space-between' : 'flex-start',
                    gap: isSessionActive ? undefined : '0.5rem'
                }}>
                    {/* Live/Waiting Status */}
                    <div style={{
                        ...statBoxStyle,
                        background: 'var(--color-white)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        {isConnected ? (
                            isSessionActive ? (
                                <>
                                    <div className="status-indicator online" />
                                    <span style={{ fontWeight: 700 }}>LIVE</span>
                                </>
                            ) : (
                                <>
                                    <div className="status-indicator offline" />
                                    <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>WAITING FOR NEXT SESSION</span>
                                </>
                            )
                        ) : (
                            <>
                                <div className="status-indicator offline" />
                                <span style={{ fontWeight: 700 }}>CONNECTING...</span>
                            </>
                        )}
                    </div>

                    {session ? (
                        <>
                            {(isSessionActive || hasLastSession) && (
                                <>
                                    <ElapsedTimeTooltip startedAt={session?.startedAt || session?.lastSession?.endedAt || 0}>
                                        {/* Session ID - show last session ID or current */}
                                        <div style={{ ...statBoxStyle, background: 'var(--color-warning)' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                                {hasLastSession ? 'Last Session' : 'Session'}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 700, wordBreak: 'break-all' }}>
                                                {hasLastSession ? session.lastSession?.sessionId : session.id}
                                            </div>
                                        </div>
                                    </ElapsedTimeTooltip>
                                </>
                            )}

                            {/* Status - show ENDED when inactive */}
                            <div style={{
                                ...statBoxStyle,
                                background: isSessionActive ? 'var(--color-success)' : 'var(--color-danger)',
                                color: isSessionActive ? 'var(--color-black)' : 'var(--color-white)'
                            }} className={isSessionActive ? "hide-on-short" : ""}>
                                <ElapsedTimeTooltip startedAt={session?.startedAt || session?.lastSession?.endedAt || 0}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{isSessionActive ? 'ACTIVE' : 'ENDED'}</div>
                                </ElapsedTimeTooltip>
                            </div>

                            {/* Only show these when session is active */}
                            {isSessionActive && (
                                <>
                                    <Tooltip content="📈 Heads probability scales with time + global flips">
                                        <div style={{ ...statBoxStyle, background: 'var(--color-accent)', cursor: 'help' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Heads %</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{((session.headsProbability ?? 0) * 100).toFixed(1)}%</div>
                                        </div>
                                    </Tooltip>
                                    <Tooltip content="📈 Heads probability scales with time + global flips">
                                        <div style={{ ...statBoxStyle, background: 'var(--color-white)', cursor: 'help' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Global Flips</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{session.totalFlips}</div>
                                        </div>
                                    </Tooltip>
                                    <div style={{ ...statBoxStyle, background: 'var(--color-warning)' }} className="hide-on-short">
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Players</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{session.players}</div>
                                    </div>
                                </>
                            )}

                            {/* Show last session stats when inactive with lastSession */}
                            {hasLastSession && session.lastSession && (
                                <div style={{ ...statBoxStyle, background: 'var(--color-white)' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Flips</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{session.lastSession.totalFlips}</div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ ...statBoxStyle, background: 'var(--color-white)', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontStyle: 'italic', color: '#666' }}>Waiting...</span>
                        </div>
                    )}
                </div>

                {/* Middle Column - Game Area */}
                <div style={{
                    flex: '1 1 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    minWidth: 0,
                    minHeight: 0
                }}>
                    {/* Player Stats */}
                    {isSessionActive && player ? (
                        <div style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--color-secondary)',
                            border: 'var(--border-brutal)',
                            boxShadow: 'var(--shadow-brutal)',
                            display: 'flex',
                            justifyContent: 'space-around',
                            color: 'var(--color-white)',
                            flexShrink: 0
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700 }}>YOUR STREAK</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{player.streak}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700 }}>FLIPS LEFT</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{player.remainingFlips}</div>
                            </div>
                        </div>
                    ) : isSessionActive ? (
                        <div style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--color-secondary)',
                            border: 'var(--border-brutal)',
                            boxShadow: 'var(--shadow-brutal)',
                            display: 'flex',
                            justifyContent: 'center',
                            color: 'var(--color-white)',
                            flexShrink: 0
                        }}>
                            <span style={{ fontStyle: 'italic', opacity: 0.7, fontSize: '0.85rem' }}>Connect wallet and sign connection to play</span>
                        </div>
                    ) : null}

                    {/* Coin Scene */}
                    <div style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden' }}>
                        <CoinScene />
                    </div>
                </div>

                {/* Right Column - Leaderboard */}
                <div style={{
                    width: '240px',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0
                }}>
                    <Leaderboard />
                </div>
            </div>

            {/* Buttons Row - Only show when session is active */}
            {isSessionActive && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                        onMouseDown={() => {
                            playButtonPress();
                        }}
                        onMouseUp={() => {
                            // Play release sound only for non-flip actions
                            if (!isAuthenticated || isFlipping) {
                                playButtonRelease();
                            }
                        }}
                        onClick={() => {
                            if (!isWalletConnected) {
                                connectWallet({ connector: injected() });
                            } else if (!isAuthenticated && authRejected) {
                                retryAuth();
                            } else if (isAuthenticated) {
                                playFlip();
                                flip();
                            }
                        }}
                        disabled={isFlipping}
                        style={{
                            fontSize: '1.1rem',
                            padding: '0.6rem 1.5rem',
                            background: isFlipping ? '#ccc' : 'var(--color-primary)'
                        }}
                    >
                        {isFlipping ? 'FLIPPING...' : (!isWalletConnected ? 'CONNECT WALLET' : (!isAuthenticated ? 'SIGN TO PLAY' : 'FLIP COIN'))}
                    </button>
                    <button
                        onMouseDown={playButtonPress}
                        onMouseUp={playButtonRelease}
                        onClick={() => setShowBuyModal(true)}
                        className="secondary"
                        style={{ padding: '0.6rem 0.75rem', fontSize: '0.9rem' }}
                    >
                        Buy Flips
                    </button>
                </div>
            )}

            {showBuyModal && <BuyFlipsModal onClose={() => setShowBuyModal(false)} />}
        </div>
    );
};
