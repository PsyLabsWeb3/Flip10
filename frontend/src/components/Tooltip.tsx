import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        const tooltipWidth = tooltipRef.current?.offsetWidth || 200;
        const tooltipHeight = tooltipRef.current?.offsetHeight || 50;

        // Position tooltip to the right and below cursor
        let left = e.clientX + 15;
        let top = e.clientY + 15;

        // Keep tooltip within viewport
        if (left + tooltipWidth > window.innerWidth - 10) {
            left = e.clientX - tooltipWidth - 15;
        }
        if (top + tooltipHeight > window.innerHeight - 10) {
            top = e.clientY - tooltipHeight - 15;
        }

        setPosition({ top, left });
    };

    return (
        <div
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onMouseMove={handleMouseMove}
            style={{ position: 'relative', display: 'contents' }}
        >
            {children}
            {isVisible && (
                <div
                    ref={tooltipRef}
                    style={{
                        position: 'fixed',
                        top: position.top,
                        left: position.left,
                        background: 'var(--color-black)',
                        color: 'var(--color-white)',
                        padding: '0.75rem 1rem',
                        border: 'var(--border-brutal)',
                        boxShadow: 'var(--shadow-brutal)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        zIndex: 1000,
                        maxWidth: '250px',
                        whiteSpace: 'pre-wrap',
                        pointerEvents: 'none'
                    }}
                >
                    {content}
                </div>
            )}
        </div>
    );
};

// Helper to format elapsed time
export function formatElapsedTime(startedAt: number): string {
    const now = Date.now();
    const elapsed = Math.floor((now - startedAt) / 1000);

    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
}

// Dynamic tooltip for elapsed time that updates every second
export const ElapsedTimeTooltip: React.FC<{ startedAt: number; children: React.ReactNode }> = ({ startedAt, children }) => {
    const [elapsed, setElapsed] = useState(formatElapsedTime(startedAt));

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(formatElapsedTime(startedAt));
        }, 1000);
        return () => clearInterval(interval);
    }, [startedAt]);

    return (
        <Tooltip content={<>⏱️ Session time: <strong>{elapsed}</strong></>}>
            {children}
        </Tooltip>
    );
};
