import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

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
        <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            background: 'var(--color-primary)',
            borderBottom: 'var(--border-brutal)'
        }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-black)' }}>FLIP10</div>

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
                        <button onClick={handleDisconnect} className="ghost">Disconnect</button>
                    </div>
                ) : (
                    <button onClick={() => connect({ connector: injected() })}>Connect Wallet</button>
                )}
            </div>
        </header>
    );
};

