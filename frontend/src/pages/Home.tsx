import React, { useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useGameStore } from '../store/useGameStore';
import { CoinScene } from '../components/CoinScene';
import { Leaderboard } from '../components/Leaderboard';
import { BuyFlipsModal } from '../components/BuyFlipsModal';

export const Home: React.FC = () => {
    const { isConnected: isWalletConnected } = useAccount();
    const { connect: connectWallet } = useConnect();
    const { connect, isConnected, session, flip, isFlipping, player, isAuthenticated, authRejected, retryAuth, showBuyModal, setShowBuyModal } = useGameStore();

    useEffect(() => {
        connect();
    }, [connect]);

    const statBoxStyle = {
        padding: '0.75rem 1rem',
        border: 'var(--border-brutal)',
        boxShadow: 'var(--shadow-brutal)'
    };

    return (
        <div style={{
            display: 'flex',
            gap: '1rem',
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '1rem',
            height: 'calc(100vh - 200px)',
            boxSizing: 'border-box'
        }}>
            {/* Left Column - Session Info */}
            <div style={{
                width: '240px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
            }}>
                {/* Live Status */}
                <div style={{
                    ...statBoxStyle,
                    background: 'var(--color-white)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <div className={`status-indicator ${isConnected ? 'online' : 'offline'}`} />
                    <span style={{ fontWeight: 700 }}>{isConnected ? 'LIVE' : 'CONNECTING...'}</span>
                </div>

                {session ? (
                    <>
                        <div style={{ ...statBoxStyle, background: 'var(--color-warning)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Session</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, wordBreak: 'break-all' }}>{session.id}</div>
                        </div>
                        <div style={{
                            ...statBoxStyle,
                            background: session.active ? 'var(--color-success)' : 'var(--color-danger)',
                            color: session.active ? 'var(--color-black)' : 'var(--color-white)'
                        }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{session.active ? 'ACTIVE' : 'ENDED'}</div>
                        </div>
                        <div style={{ ...statBoxStyle, background: 'var(--color-accent)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Heads %</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{(session.headsProbability * 100).toFixed(1)}%</div>
                        </div>
                        <div style={{ ...statBoxStyle, background: 'var(--color-white)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Players</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{session.players}</div>
                        </div>
                    </>
                ) : (
                    <div style={{ ...statBoxStyle, background: 'var(--color-white)', textAlign: 'center' }}>
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
                {player ? (
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
                ) : (
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
                        <span style={{ fontStyle: 'italic', opacity: 0.7, fontSize: '0.85rem' }}>Connect wallet to play</span>
                    </div>
                )}

                {/* Coin Scene */}
                <div style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden' }}>
                    <CoinScene />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                        onClick={() => {
                            if (!isWalletConnected) {
                                connectWallet({ connector: injected() });
                            } else if (!isAuthenticated && authRejected) {
                                retryAuth();
                            } else if (isAuthenticated) {
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
                    <button onClick={() => setShowBuyModal(true)} className="secondary" style={{ padding: '0.6rem 0.75rem', fontSize: '0.9rem' }}>
                        Buy Flips
                    </button>
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

            {showBuyModal && <BuyFlipsModal onClose={() => setShowBuyModal(false)} />}
        </div >
    );
};
