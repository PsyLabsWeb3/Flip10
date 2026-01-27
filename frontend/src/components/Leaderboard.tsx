import React, { useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

export const Leaderboard: React.FC = () => {
    const { session } = useGameStore();
    const prevPositionsRef = useRef<Map<string, number>>(new Map());
    const animationKeyRef = useRef(0);

    // Determine if we're showing last results (inactive session with lastSession data)
    const isShowingLastResults = session && !session.active && session.lastSession;

    // Get the appropriate leaderboard data
    const leaderboardData = isShowingLastResults
        ? session.lastSession?.finalLeaderboard
        : session?.leaderboard;

    // Get winner address for highlighting
    const winnerAddress = isShowingLastResults ? session.lastSession?.winner : null;

    // Track position changes for animations (only during active sessions)
    const positionChanges = React.useMemo(() => {
        const changes = new Map<string, 'climb' | 'descend' | null>();

        // Skip animations for last results view
        if (isShowingLastResults) {
            return changes;
        }

        if (session?.leaderboard) {
            const currentPositions = new Map<string, number>();
            session.leaderboard.forEach((entry, i) => {
                currentPositions.set(entry.address, i);

                const prevPos = prevPositionsRef.current.get(entry.address);
                if (prevPos !== undefined) {
                    if (i < prevPos) {
                        changes.set(entry.address, 'climb');
                    } else if (i > prevPos) {
                        changes.set(entry.address, 'descend');
                    }
                }
            });

            // Update ref after calculating changes
            prevPositionsRef.current = currentPositions;
            if (changes.size > 0) {
                animationKeyRef.current++;
            }
        }

        return changes;
    }, [session?.leaderboard, isShowingLastResults]);

    // Hide leaderboard when session is inactive with no lastSession data
    if (session && !session.active && !session.lastSession) {
        return null;
    }

    // Show empty state when no session or empty leaderboard during active session
    if (!session || (!isShowingLastResults && (!session.leaderboard || session.leaderboard.length === 0))) {
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
                No active streaks yet.
            </div>
        );
    }

    // No data to show
    if (!leaderboardData || leaderboardData.length === 0) {
        return null;
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
            <h3 style={{ margin: 0, padding: '1rem', borderBottom: 'var(--border-brutal)' }}>
                {isShowingLastResults ? 'LAST RESULTS' : 'LEADERBOARD'}
            </h3>
            {isShowingLastResults && winnerAddress && (
                <div style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--color-success)',
                    borderBottom: 'var(--border-brutal)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        🏆 Winner
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700 }}>
                        {winnerAddress.slice(0, 6)}...{winnerAddress.slice(-4)}
                    </div>
                </div>
            )}
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
                        {leaderboardData.map((entry, i) => {
                            const change = positionChanges.get(entry.address);
                            const animClass = change === 'climb' ? 'lb-climb' : change === 'descend' ? 'lb-descend' : '';
                            const isWinner = winnerAddress && entry.address.toLowerCase() === winnerAddress.toLowerCase();

                            return (
                                <tr
                                    key={`${entry.address}-${animationKeyRef.current}`}
                                    className={animClass}
                                    style={isWinner ? { background: 'var(--color-warning)' } : undefined}
                                >
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
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
