import React from 'react';
import { playButtonPress, playButtonRelease } from '../utils/sfx';

interface HowToPlayModalProps {
    onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '500px' }}
            >
                <h2 style={{ marginBottom: '1.5rem' }}>🎰 HOW TO PLAY</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)' }}>1. Connect Your Wallet</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                            Tap the wallet button to connect your wallet.
                        </p>
                    </div>

                    <div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)' }}>2. Buy Flips</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                            Tap "Buy Flips" to purchase flip packages. Each flip gives you one chance to flip the coin.
                        </p>
                    </div>

                    <div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)' }}>3. Flip the Coin</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                            Tap "Flip Coin" to flip! <strong>Heads = good</strong>, your streak increases. <strong>Tails = bad</strong>, your streak resets to 0.
                        </p>
                    </div>

                    <div style={{
                        background: 'var(--color-warning)',
                        padding: '1rem',
                        border: 'var(--border-brutal)',
                        marginTop: '0.5rem'
                    }}>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>🏆 THE GOAL</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                            Get <strong>10 HEADS IN A ROW</strong> to win the session prize pool!
                        </p>
                    </div>

                    <div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)' }}>4. Claim Your Prize</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                            If you win, go to the "CLAIM" tab to collect your prize pool winnings!
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button onMouseDown={playButtonPress} onMouseUp={playButtonRelease} onClick={onClose}>GOT IT!</button>
                </div>
            </div>
        </div>
    );
};
