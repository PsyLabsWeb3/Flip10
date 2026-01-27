import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Claim } from './pages/Claim';
import { useAuthFlow } from './hooks/useAuthFlow';

function AppContent() {
    // Handle WS + wallet authentication flow
    useAuthFlow();

    return (
        <>
            <nav style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                padding: '1rem',
                background: 'var(--color-white)',
                borderBottom: 'var(--border-brutal)'
            }}>
                <Link
                    to="/"
                    style={{
                        padding: '0.5rem 1.5rem',
                        background: 'var(--color-black)',
                        color: 'var(--color-white)',
                        border: 'var(--border-brutal)',
                        fontWeight: 700,
                        textDecoration: 'none'
                    }}
                >
                    PLAY
                </Link>
                <Link
                    to="/claim"
                    style={{
                        padding: '0.5rem 1.5rem',
                        background: 'var(--color-warning)',
                        color: 'var(--color-black)',
                        border: 'var(--border-brutal)',
                        fontWeight: 700,
                        textDecoration: 'none'
                    }}
                >
                    CLAIM
                </Link>
            </nav>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/claim" element={<Claim />} />
            </Routes>
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

