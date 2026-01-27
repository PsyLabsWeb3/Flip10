import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { Home } from './pages/Home';
import { Claim } from './pages/Claim';
import { HowToPlayModal } from './components/HowToPlayModal';
import { WinModal } from './components/WinModal';
import { Tooltip } from './components/Tooltip';
import { useAuthFlow } from './hooks/useAuthFlow';
import { useGameStore } from './store/useGameStore';
import { playButtonPress, playButtonRelease, getMuted, setMuted } from './utils/sfx';

function AppContent() {
  // Initialize MiniKit
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* Header with Logo */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        background: 'var(--color-primary)',
        borderBottom: 'var(--border-brutal)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/flip10-logo.png" alt="Flip10" style={{ height: '32px' }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--color-black)' }}>
            by <strong>Psy Labs</strong>
          </span>
        </div>
        {/* Mute button */}
        <Tooltip content={isMuted ? '🔇 Tap to unmute' : '🔊 Tap to mute'}>
          <button
            onMouseDown={playButtonPress}
            onMouseUp={playButtonRelease}
            onClick={handleToggleMute}
            style={{
              padding: '0.4rem 0.75rem',
              background: isMuted ? '#ccc' : 'var(--color-white)',
              color: 'var(--color-black)',
              fontWeight: 700,
              fontSize: '1rem',
              minWidth: 'auto'
            }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </Tooltip>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs" style={{
        display: 'flex',
        gap: '0.35rem',
        justifyContent: 'center',
        padding: '0.5rem',
        background: 'var(--color-white)',
        borderBottom: 'var(--border-brutal)',
        flexShrink: 0,
        flexWrap: 'wrap'
      }}>
        <button
          onMouseDown={playButtonPress}
          onMouseUp={playButtonRelease}
          onClick={() => navigate('/')}
          style={{
            padding: '0.4rem 1rem',
            background: 'var(--color-black)',
            color: 'var(--color-white)',
            fontWeight: 700,
            fontSize: '0.85rem',
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
            padding: '0.4rem 1rem',
            background: 'var(--color-warning)',
            color: 'var(--color-black)',
            fontWeight: 700,
            fontSize: '0.85rem',
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
            padding: '0.4rem 1rem',
            background: 'var(--color-accent)',
            color: 'var(--color-black)',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}
        >
          HOW TO PLAY
        </button>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/claim" element={<Claim />} />
        </Routes>
      </main>

      {/* Built on Base badge - smaller for mobile */}
      <div style={{
        position: 'fixed',
        bottom: '0.5rem',
        right: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        background: 'var(--color-white)',
        padding: '0.35rem 0.75rem',
        border: 'var(--border-brutal)',
        boxShadow: 'var(--shadow-brutal)',
        fontSize: '0.7rem',
        fontWeight: 700,
        zIndex: 100
      }}>
        built on
        <img src="/base-logo.png" alt="Base" style={{ height: '18px' }} />
      </div>

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
      {showWinModal && <WinModal onClose={() => setShowWinModal(false)} />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
