import React from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { playWin, playButtonPress, playButtonRelease } from '../utils/sfx';

interface WinModalProps {
    onClose: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({ onClose }) => {
    const navigate = useNavigate();

    React.useEffect(() => {
        // Play win sounds
        playWin();

        // Epic fireworks celebration
        const duration = 8000;
        const end = Date.now() + duration;
        const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3', '#FFD700', '#FF6B35'];

        const frame = () => {
            // Side cannons
            confetti({
                particleCount: 10,
                angle: 60,
                spread: 80,
                origin: { x: 0, y: 0.8 },
                colors,
                startVelocity: 55,
                zIndex: 10000
            });
            confetti({
                particleCount: 10,
                angle: 120,
                spread: 80,
                origin: { x: 1, y: 0.8 },
                colors,
                startVelocity: 55,
                zIndex: 10000
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();

        // Massive center explosions
        const explosionIntervals = [0, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000];
        explosionIntervals.forEach((delay) => {
            setTimeout(() => {
                confetti({
                    particleCount: 200,
                    spread: 360,
                    origin: { x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.4 + 0.3 },
                    colors,
                    startVelocity: 45,
                    ticks: 120,
                    shapes: ['star', 'circle'],
                    scalar: 1.3,
                    zIndex: 10000
                });
            }, delay);
        });

        // Star bursts
        [1000, 2000, 3000, 4000, 5000, 6000].forEach((delay) => {
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    spread: 360,
                    origin: { x: 0.5, y: 0.5 },
                    shapes: ['star'],
                    colors: ['#FFD700', '#FFFFFF'],
                    scalar: 2.5,
                    startVelocity: 40,
                    zIndex: 10000
                });
            }, delay);
        });
    }, []);

    const handleGoToClaim = () => {
        onClose();
        navigate('/claim');
    };

    const handleShare = () => {
        const shareText = `I just flipped 10 heads in a row on Flip10! 🏆\n\nCan you beat my luck?`;
        // Using Farcaster Intent URL which is the standard way to trigger a cast 
        // from a web view or mini-app.
        const intentUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
        window.open(intentUrl, '_blank');
    };

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
                    textAlign: 'center',
                    maxWidth: '500px',
                    animation: 'streak-pop 0.5s ease-out'
                }}
            >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆🎉🏆</div>
                <h1 style={{
                    margin: '0 0 1rem 0',
                    fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
                    color: 'var(--color-primary)',
                    textShadow: '3px 3px 0 var(--color-black)'
                }}>
                    YOU WON!
                </h1>
                <p style={{
                    fontSize: '1.2rem',
                    marginBottom: '1.5rem',
                    fontWeight: 700
                }}>
                    🎊 10 HEADS IN A ROW! 🎊
                </p>
                <p style={{
                    fontSize: '1rem',
                    marginBottom: '2rem',
                    color: '#666'
                }}>
                    Congratulations! You've won the session prize pool!
                    <br />
                    Head to the CLAIM section to collect your reward.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onMouseDown={playButtonPress}
                        onMouseUp={playButtonRelease}
                        onClick={handleGoToClaim}
                        style={{
                            padding: '1rem 2rem',
                            fontSize: '1.2rem',
                            background: 'var(--color-warning)',
                            fontWeight: 700
                        }}
                    >
                        🎁 CLAIM REWARD
                    </button>
                    <button
                        onMouseDown={playButtonPress}
                        onMouseUp={playButtonRelease}
                        onClick={handleShare}
                        style={{
                            padding: '1rem 2rem',
                            fontSize: '1.2rem',
                            background: 'var(--color-accent)',
                            color: 'var(--color-black)',
                            fontWeight: 700,
                            border: 'none',
                        }}
                    >
                        📤 SHARE
                    </button>
                    <button
                        onMouseDown={playButtonPress}
                        onMouseUp={playButtonRelease}
                        onClick={onClose}
                        className="ghost"
                        style={{ padding: '1rem 1.5rem' }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
