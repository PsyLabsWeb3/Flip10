import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationProps {
    streak: number;
    trigger: boolean;
}

export const Celebration: React.FC<CelebrationProps> = ({ streak, trigger }) => {
    const prevTriggerRef = useRef(false);

    useEffect(() => {
        // Only fire when trigger changes from false to true
        if (trigger && !prevTriggerRef.current && streak > 0) {
            fireCelebration(streak);
        }
        prevTriggerRef.current = trigger;
    }, [trigger, streak]);

    return null; // This component just triggers effects
};

function fireCelebration(streak: number) {
    const duration = 1000 + streak * 200;
    const particleCount = 30 + streak * 20;

    // Base confetti settings
    const defaults = {
        startVelocity: 25 + streak * 3,
        spread: 360,
        ticks: 60 + streak * 10,
        zIndex: 9999,
        disableForReducedMotion: true
    };

    // Level 1-2: Simple confetti burst
    if (streak <= 2) {
        confetti({
            ...defaults,
            particleCount,
            origin: { x: 0.5, y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF6B35']
        });
    }
    // Level 3-4: Double burst from sides
    else if (streak <= 4) {
        confetti({
            ...defaults,
            particleCount: particleCount * 0.6,
            origin: { x: 0.3, y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF6B35', '#22d3ee']
        });
        confetti({
            ...defaults,
            particleCount: particleCount * 0.6,
            origin: { x: 0.7, y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF6B35', '#22d3ee']
        });
    }
    // Level 5-6: Triple burst with stars
    else if (streak <= 6) {
        // Main confetti
        confetti({
            ...defaults,
            particleCount,
            origin: { x: 0.5, y: 0.5 },
            colors: ['#FFD700', '#FFA500', '#a855f7', '#22d3ee', '#84cc16']
        });
        // Side bursts
        setTimeout(() => {
            confetti({
                ...defaults,
                particleCount: particleCount * 0.4,
                origin: { x: 0.2, y: 0.7 },
                shapes: ['star'],
                colors: ['#FFD700', '#FFFFFF']
            });
            confetti({
                ...defaults,
                particleCount: particleCount * 0.4,
                origin: { x: 0.8, y: 0.7 },
                shapes: ['star'],
                colors: ['#FFD700', '#FFFFFF']
            });
        }, 200);
    }
    // Level 7-8: Fireworks style with emojis
    else if (streak <= 8) {
        // Multi-point explosions
        const points = [
            { x: 0.3, y: 0.4 },
            { x: 0.7, y: 0.4 },
            { x: 0.5, y: 0.3 },
            { x: 0.2, y: 0.6 },
            { x: 0.8, y: 0.6 }
        ];

        points.forEach((origin, i) => {
            setTimeout(() => {
                confetti({
                    ...defaults,
                    particleCount: particleCount * 0.5,
                    origin,
                    colors: ['#FFD700', '#FF6B35', '#a855f7', '#22d3ee', '#ef4444', '#84cc16'],
                    shapes: ['circle', 'star']
                });
            }, i * 100);
        });

        // Fire emoji shapes from bottom
        setTimeout(() => {
            confetti({
                ...defaults,
                particleCount: 10,
                origin: { x: 0.5, y: 1 },
                startVelocity: 45,
                gravity: 0.8,
                scalar: 2,
                shapes: ['circle'],
                colors: ['#FF4500', '#FF6347', '#FFD700']
            });
        }, 300);
    }
    // Level 9: INSANE celebration
    else if (streak === 9) {
        // Continuous fireworks
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#FFD700', '#FF6B35', '#a855f7', '#22d3ee', '#84cc16'],
                zIndex: 9999
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#FFD700', '#FF6B35', '#a855f7', '#22d3ee', '#84cc16'],
                zIndex: 9999
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();

        // Center explosions
        [0, 200, 400, 600].forEach((delay) => {
            setTimeout(() => {
                confetti({
                    ...defaults,
                    particleCount: 80,
                    origin: { x: 0.5, y: 0.5 },
                    shapes: ['star', 'circle'],
                    colors: ['#FFD700', '#FFFFFF', '#FF6B35', '#a855f7']
                });
            }, delay);
        });
    }
    // Level 10: ABSOLUTE MADNESS 🤯
    else if (streak >= 10) {
        // Epic finale - continuous cannon fire
        const end = Date.now() + 4000;

        // Rainbow colors
        const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3', '#FFD700'];

        const frame = () => {
            // Side cannons
            confetti({
                particleCount: 8,
                angle: 60,
                spread: 80,
                origin: { x: 0, y: 0.8 },
                colors,
                startVelocity: 55,
                zIndex: 9999
            });
            confetti({
                particleCount: 8,
                angle: 120,
                spread: 80,
                origin: { x: 1, y: 0.8 },
                colors,
                startVelocity: 55,
                zIndex: 9999
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();

        // Massive center explosions
        [0, 300, 600, 900, 1200, 1500, 2000, 2500, 3000].forEach((delay) => {
            setTimeout(() => {
                confetti({
                    particleCount: 150,
                    spread: 360,
                    origin: { x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.4 + 0.3 },
                    colors,
                    startVelocity: 40,
                    ticks: 100,
                    shapes: ['star', 'circle'],
                    scalar: 1.2,
                    zIndex: 9999
                });
            }, delay);
        });

        // Star bursts
        [500, 1000, 1500, 2000, 2500].forEach((delay) => {
            setTimeout(() => {
                confetti({
                    particleCount: 30,
                    spread: 360,
                    origin: { x: 0.5, y: 0.5 },
                    shapes: ['star'],
                    colors: ['#FFD700', '#FFFFFF'],
                    scalar: 2,
                    startVelocity: 35,
                    zIndex: 9999
                });
            }, delay);
        });
    }
}
