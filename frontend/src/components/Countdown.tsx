import React, { useState, useEffect } from 'react';

interface CountdownProps {
    targetTimestamp: number;
}

export const Countdown: React.FC<CountdownProps> = ({ targetTimestamp }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = Date.now();
            const diff = targetTimestamp - now;

            if (diff <= 0) {
                return 'Starting soon...';
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        setTimeLeft(calculateTimeLeft());

        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(interval);
    }, [targetTimestamp]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '1rem'
        }}>
            <div style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--color-black)',
                opacity: 0.7
            }}>
                Next Session In
            </div>
            <div style={{
                fontSize: '3rem',
                fontWeight: 700,
                fontFamily: 'monospace',
                color: 'var(--color-primary)',
                textShadow: '3px 3px 0 var(--color-black)'
            }}>
                {timeLeft}
            </div>
            <div style={{
                fontSize: '0.8rem',
                color: '#666',
                fontStyle: 'italic'
            }}>
                Come back when the session starts!
            </div>
        </div>
    );
};
