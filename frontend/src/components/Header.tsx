import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import flip10Logo from '/flip10-logo.png';
import { playButtonPress, playButtonRelease } from '../utils/sfx';

export const Header: React.FC = () => {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnectAsync } = useDisconnect();

    const handleDisconnect = async () => {
        try {
            await disconnectAsync();
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    };

    return (
        <header className="header-main" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            background: 'var(--color-primary)',
            borderBottom: 'var(--border-brutal)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src={flip10Logo} alt="Flip10" style={{ height: '48px' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-black)' }}>
                    powered by{' '}
                    <a
                        href="https://github.com/PsyLabsWeb3"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--color-black)', fontWeight: 700 }}
                    >
                        Psy Labs
                    </a>
                </span>
            </div>

            <div>
                {isConnected ? (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{
                            background: 'var(--color-white)',
                            padding: '0.5rem 1rem',
                            border: 'var(--border-brutal)',
                            fontWeight: 700
                        }}>
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                        </span>
                        <button onMouseDown={playButtonPress} onMouseUp={playButtonRelease} onClick={handleDisconnect} className="ghost">Disconnect</button>
                    </div>
                ) : (
                    <button onMouseDown={playButtonPress} onMouseUp={playButtonRelease} onClick={() => connect({ connector: injected() })}>Connect Wallet</button>
                )}
            </div>
        </header>
    );
};

