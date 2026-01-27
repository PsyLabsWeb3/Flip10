import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Claim } from './pages/Claim';
import { HowToPlayModal } from './components/HowToPlayModal';
import { WinModal } from './components/WinModal';
import { Tooltip } from './components/Tooltip';
import { useAuthFlow } from './hooks/useAuthFlow';
import { useGameStore } from './store/useGameStore';
import { playButtonPress, playButtonRelease, getMuted, setMuted } from './utils/sfx';

function AppContent() {
    // Handle WS + wallet authentication flow
    useAuthFlow();
    const [showHowToPlay, setShowHowToPlay] = useState(false);
    const [isMuted, setIsMuted] = useState(getMuted());
    const { showWinModal, setShowWinModal } = useGameStore();
    const navigate = useNavigate();
    const location = useLocation();

    const isOnPlay = location.pathname === '/';
    const isOnClaim = location.pathname === '/claim';

    // Pressed button style (no shadow, translated)
    const pressedStyle = {
        transform: 'translate(4px, 4px)',
        boxShadow: 'none'
    };

    const handleToggleMute = () => {
        const newMuted = !isMuted;
        setMuted(newMuted);
        setIsMuted(newMuted);
    };

    return (
        <>
            <nav className="nav-tabs" style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                padding: '1rem',
                background: 'var(--color-white)',
                borderBottom: 'var(--border-brutal)',
                position: 'relative'
            }}>
                <button
                    onMouseDown={playButtonPress}
                    onMouseUp={playButtonRelease}
                    onClick={() => navigate('/')}
                    style={{
                        padding: '0.5rem 1.5rem',
                        background: 'var(--color-black)',
                        color: 'var(--color-white)',
                        fontWeight: 700,
                        ...(isOnPlay ? pressedStyle : {})
                    }}
                >
                    PLAY
                </button>
                <button
                    onMouseDown={playButtonPress}
                    onMouseUp={playButtonRelease}
                    onClick={() => navigate('/claim')}
                    style={{
                        padding: '0.5rem 1.5rem',
                        background: 'var(--color-warning)',
                        color: 'var(--color-black)',
                        fontWeight: 700,
                        ...(isOnClaim ? pressedStyle : {})
                    }}
                >
                    CLAIM
                </button>
                <button
                    onMouseDown={playButtonPress}
                    onMouseUp={playButtonRelease}
                    onClick={() => setShowHowToPlay(true)}
                    style={{
                        padding: '0.5rem 1.5rem',
                        background: 'var(--color-accent)',
                        color: 'var(--color-black)',
                        fontWeight: 700
                    }}
                >
                    HOW TO PLAY
                </button>
                {/* Mute button - aligned to the right */}
                <Tooltip content={isMuted ? '🔇 Click to unmute sounds' : '🔊 Click to mute sounds'}>
                    <button
                        onMouseDown={playButtonPress}
                        onMouseUp={playButtonRelease}
                        onClick={handleToggleMute}
                        style={{
                            position: 'absolute',
                            right: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            padding: '0.5rem 1rem',
                            background: isMuted ? '#ccc' : 'var(--color-white)',
                            color: 'var(--color-black)',
                            fontWeight: 700,
                            fontSize: '1.2rem'
                        }}
                    >
                        {isMuted ? '🔇' : '🔊'}
                    </button>
                </Tooltip>
            </nav>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/claim" element={<Claim />} />
            </Routes>
            {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
            {showWinModal && <WinModal onClose={() => setShowWinModal(false)} />}
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <AppContent />
            </Layout>
        </BrowserRouter>
    );
}

export default App;
