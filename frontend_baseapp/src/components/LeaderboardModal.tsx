import React from 'react';
import { Leaderboard } from './Leaderboard';
import { playButtonPress, playButtonRelease } from '../utils/sfx';

interface LeaderboardModalProps {
    onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
    return (
        <div
            className="modal-overlay"
            style={{
                zIndex: 9999,
                background: 'rgba(0, 0, 0, 0.8)'
            }}
        >
            <div
                className="modal"
                style={{
                    width: '90%',
                    maxWidth: '400px',
                    height: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    overflow: 'hidden'
                }}
            >
                <div style={{
                    padding: '0.5rem',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    background: 'var(--color-white)',
                    borderBottom: 'var(--border-brutal)'
                }}>
                    <button
                        onMouseDown={playButtonPress}
                        onMouseUp={playButtonRelease}
                        onClick={onClose}
                        className="ghost"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                        ❌ Close
                    </button>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                    <Leaderboard />
                </div>
            </div>
        </div>
    );
};
