import React, { ReactNode, useState, useEffect } from 'react';
import { Header } from './Header';

interface LayoutProps {
    children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Mobile view - show only logo and message
    if (isMobile) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                background: 'var(--color-primary)',
                textAlign: 'center'
            }}>
                <img
                    src="/flip10-logo.png"
                    alt="Flip10"
                    style={{
                        width: '80%',
                        maxWidth: '300px',
                        marginBottom: '2rem'
                    }}
                />
                <div style={{
                    background: 'var(--color-white)',
                    border: 'var(--border-brutal)',
                    boxShadow: 'var(--shadow-brutal)',
                    padding: '1.5rem',
                    maxWidth: '400px'
                }}>
                    <h2 style={{ margin: '0 0 1rem 0' }}>📱 Desktop Only</h2>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                        Flip10 is currently only available on desktop devices.
                        Please visit us on a computer to play!
                    </p>
                </div>
                {/* Built on Base badge */}
                <div style={{
                    position: 'fixed',
                    bottom: '1rem',
                    right: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--color-white)',
                    padding: '0.5rem 1rem',
                    border: 'var(--border-brutal)',
                    boxShadow: 'var(--shadow-brutal)',
                    fontSize: '0.8rem',
                    fontWeight: 700
                }}>
                    built on
                    <img src="/base-logo.png" alt="Base" style={{ height: '20px' }} />
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main style={{ flex: 1 }}>
                {children}
            </main>
            {/* Built on Base badge */}
            <div style={{
                position: 'fixed',
                bottom: '1rem',
                right: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--color-white)',
                padding: '0.5rem 1rem',
                border: 'var(--border-brutal)',
                boxShadow: 'var(--shadow-brutal)',
                fontSize: '0.8rem',
                fontWeight: 700,
                zIndex: 100
            }}>
                built on
                <img src="/base-logo.png" alt="Base" style={{ height: '25px' }} />
            </div>
        </div>
    );
};
