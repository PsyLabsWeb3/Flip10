import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { Celebration } from './Celebration';
import { Countdown } from './Countdown';
import { playLostStreak, playStreakSound, playTails } from '../utils/sfx';

const STREAK_MESSAGES: { [key: number]: string } = {
    1: "Heads! Nice start!",
    2: "Two in a row! Warming up!",
    3: "Three straight! You're on a roll!",
    4: "Four heads! Momentum is building 👀",
    5: "Five! Halfway to greatness!",
    6: "Six in a row! This is getting serious 🔥",
    7: "Seven! The coin is on your side!",
    8: "Eight straight heads! Unbelievable luck!",
    9: "Nine! One away from legend status!",
    10: "TEN HEADS IN A ROW 🤯 ABSOLUTE MADNESS! YOU WIN!!!"
};

function CoinMesh({ isFlipping, result }: { isFlipping: boolean; result: 'heads' | 'tails' | null }) {
    const groupRef = useRef<THREE.Group>(null);
    const rotationSpeed = useRef(0);

    useEffect(() => {
        if (!isFlipping && result && groupRef.current) {
            const target = result === 'heads' ? 0 : Math.PI;
            const currentX = groupRef.current.rotation.x % (Math.PI * 2);
            const rounds = Math.ceil(currentX / (Math.PI * 2));
            groupRef.current.rotation.x = rounds * Math.PI * 2 + target;
        }
    }, [isFlipping, result]);

    useFrame((_state, delta) => {
        if (!groupRef.current) return;

        if (isFlipping) {
            rotationSpeed.current = 20;
            groupRef.current.rotation.x += rotationSpeed.current * delta;
        } else if (result) {
            const target = result === 'heads' ? 0 : Math.PI;
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, target, 0.15);
        }
    });

    return (
        <group ref={groupRef}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 0.2, 64]} />
                <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Heads side - Happy face */}
            <mesh position={[0, 0, 0.11]}>
                <circleGeometry args={[1.4, 64]} />
                <meshStandardMaterial color="#F4C430" />
            </mesh>
            <Text position={[0, 0, 0.12]} fontSize={1.5} color="black">
                😊
            </Text>
            {/* Tails side - Sad face */}
            <mesh position={[0, 0, -0.11]} rotation={[Math.PI, 0, 0]}>
                <circleGeometry args={[1.4, 64]} />
                <meshStandardMaterial color="#C0C0C0" />
            </mesh>
            <Text position={[0, 0, -0.12]} rotation={[Math.PI, 0, 0]} fontSize={1.5} color="black">
                😢
            </Text>
        </group>
    );
}

export function CoinScene() {
    const { isFlipping, lastResult, player, session } = useGameStore();
    const [celebrateTrigger, setCelebrateTrigger] = useState(false);
    const [lostHighStreak, setLostHighStreak] = useState(false);
    const prevStreakRef = useRef<number>(0);
    const lastPlayedResultRef = useRef<'heads' | 'tails' | null>(null);

    // Track what we've already "seen" on mount to prevent replaying sounds
    const lastSeenStreakRef = useRef<number | null>(player?.streak ?? null);
    const lastSeenResultRef = useRef<'heads' | 'tails' | null>(lastResult);

    // Track previous streak and detect when we lose a high streak
    useEffect(() => {
        if (player?.streak !== undefined) {
            // If streak just dropped to 0 and previous was 5+, mark it
            // Only trigger if we've actually seen a change (not on mount)
            if (player.streak === 0 && prevStreakRef.current >= 5 && lastResult === 'tails' && lastSeenResultRef.current !== 'tails') {
                setLostHighStreak(true);
                playLostStreak();
            }
            // Update ref with current streak (only when > 0)
            if (player.streak > 0) {
                prevStreakRef.current = player.streak;
            }
        }
    }, [player?.streak, lastResult]);

    // Clear the lostHighStreak flag on next heads or when a new flip starts
    useEffect(() => {
        if (lastResult === 'heads' || isFlipping) {
            setLostHighStreak(false);
        }
    }, [lastResult, isFlipping]);

    // Play tails sound - track with ref to play once per flip result
    useEffect(() => {
        // Skip if this is the same result we mounted with
        if (lastSeenResultRef.current === lastResult && lastPlayedResultRef.current === null) {
            lastPlayedResultRef.current = lastResult;
            return;
        }

        if (lastResult === 'tails' && !isFlipping && lastPlayedResultRef.current !== 'tails') {
            playTails();
            lastPlayedResultRef.current = 'tails';
        } else if (lastResult === 'heads') {
            lastPlayedResultRef.current = 'heads';
        } else if (isFlipping) {
            // Reset when a new flip starts
            lastPlayedResultRef.current = null;
            lastSeenResultRef.current = null; // Allow next result to play
        }
    }, [lastResult, isFlipping]);

    // Get streak message based on result
    const streakMessage = React.useMemo(() => {
        if (lastResult === 'heads' && player?.streak && player.streak >= 1 && player.streak <= 10) {
            return STREAK_MESSAGES[player.streak];
        } else if (lastResult === 'tails') {
            // Don't show negative messages if we mounted with this tails result (page reload/tab switch)
            // Only show them for fresh flip results
            if (lastSeenResultRef.current === 'tails' && lastPlayedResultRef.current === null) {
                return null;
            }
            // Show "so close" message if we just lost a high streak
            if (lostHighStreak) {
                return "You were so close! Try again!";
            }
            return "Too bad. Try again!";
        }
        return null;
    }, [lastResult, player?.streak, lostHighStreak]);

    // Trigger celebration on heads
    useEffect(() => {
        // Skip if this is the same streak we mounted with
        if (lastSeenStreakRef.current === player?.streak && lastSeenResultRef.current === lastResult) {
            return;
        }

        if (lastResult === 'heads' && !isFlipping && player?.streak) {
            setCelebrateTrigger(true);
            playStreakSound(player.streak);
            // Update seen refs after playing
            lastSeenStreakRef.current = player.streak;
            lastSeenResultRef.current = lastResult;
            // Reset trigger after a short delay
            const timeout = setTimeout(() => setCelebrateTrigger(false), 100);
            return () => clearTimeout(timeout);
        }
    }, [lastResult, isFlipping, player?.streak]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '150px',
            background: 'var(--color-white)',
            border: 'var(--border-brutal)',
            boxShadow: 'var(--shadow-brutal)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {session && !session.active && session.nextSessionStartsAt ? (
                /* Show countdown when session is inactive */
                <Countdown targetTimestamp={session.nextSessionStartsAt} />
            ) : (
                <>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                            <ambientLight intensity={0.6} />
                            <directionalLight position={[5, 10, 5]} intensity={1} />
                            <CoinMesh isFlipping={isFlipping} result={lastResult} />
                            <OrbitControls enableZoom={false} enablePan={false} />
                        </Canvas>
                    </div>
                    {/* Streak message - appears only on heads */}
                    {streakMessage && !isFlipping && (
                        <div
                            key={player?.streak}
                            className="streak-message"
                            style={{
                                textAlign: 'center',
                                padding: '0.5rem 1rem',
                                fontWeight: 700,
                                fontSize: player?.streak === 10 ? 'clamp(0.9rem, 3vw, 1.1rem)' : 'clamp(0.8rem, 2.5vw, 0.95rem)',
                                color: player?.streak === 10 ? 'var(--color-primary)' : 'var(--color-black)',
                                background: player?.streak === 10 ? 'var(--color-warning)' : 'transparent',
                                borderTop: 'var(--border-brutal)'
                            }}
                        >
                            {streakMessage}
                        </div>
                    )}
                    {/* Confetti celebration */}
                    <Celebration streak={player?.streak || 0} trigger={celebrateTrigger} />
                </>
            )}
        </div>
    );
}
