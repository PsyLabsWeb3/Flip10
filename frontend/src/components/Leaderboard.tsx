import React from 'react';
import { useGameStore } from '../store/useGameStore';

export const Leaderboard: React.FC = () => {
    const { session } = useGameStore();

    if (!session || !session.leaderboard || session.leaderboard.length === 0) {
        return (
            <div style={{
                height: '100%',
                padding: '1rem',
                background: 'var(--color-white)',
                border: 'var(--border-brutal)',
                boxShadow: 'var(--shadow-brutal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666'
            }}>
                No active players yet.
            </div>
        );
    }

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-white)',
            border: 'var(--border-brutal)',
            boxShadow: 'var(--shadow-brutal)'
        }}>
            <h3 style={{ margin: 0, padding: '1rem', borderBottom: 'var(--border-brutal)' }}>LEADERBOARD</h3>
            <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
                <table style={{ width: '100%', fontSize: '0.85rem' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '0.5rem 0.25rem' }}>#</th>
                            <th style={{ padding: '0.5rem 0.25rem' }}>Player</th>
                            <th style={{ padding: '0.5rem 0.25rem' }}>Streak</th>
                        </tr>
                    </thead>
                    <tbody>
                        {session.leaderboard.map((entry, i) => (
                            <tr key={entry.address}>
                                <td style={{ fontWeight: 700, padding: '0.4rem 0.25rem' }}>{i + 1}</td>
                                <td style={{ fontFamily: 'monospace', padding: '0.4rem 0.25rem', fontSize: '0.75rem' }}>
                                    {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                                </td>
                                <td style={{ padding: '0.4rem 0.25rem' }}>
                                    <span style={{
                                        background: i === 0 ? 'var(--color-warning)' : 'var(--color-white)',
                                        padding: '0.15rem 0.4rem',
                                        border: '2px solid var(--color-black)',
                                        fontWeight: 700,
                                        fontSize: '0.8rem'
                                    }}>
                                        {entry.streak}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
