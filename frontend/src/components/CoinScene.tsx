import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';

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
            <mesh position={[0, 0, 0.11]}>
                <circleGeometry args={[1.4, 64]} />
                <meshStandardMaterial color="#F4C430" />
            </mesh>
            <Text position={[0, 0.3, 0.12]} fontSize={0.4} color="black" fontWeight="bold">
                HEADS
            </Text>
            <mesh position={[0, 0, -0.11]} rotation={[Math.PI, 0, 0]}>
                <circleGeometry args={[1.4, 64]} />
                <meshStandardMaterial color="#C0C0C0" />
            </mesh>
            <Text position={[0, 0, -0.12]} rotation={[Math.PI, 0, 0]} fontSize={0.4} color="black" fontWeight="bold">
                TAILS
            </Text>
        </group>
    );
}

export function CoinScene() {
    const { isFlipping, lastResult } = useGameStore();

    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '200px',
            background: 'var(--color-white)',
            border: 'var(--border-brutal)',
            boxShadow: 'var(--shadow-brutal)'
        }}>
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 10, 5]} intensity={1} />
                <CoinMesh isFlipping={isFlipping} result={lastResult} />
                <OrbitControls enableZoom={false} enablePan={false} />
            </Canvas>
        </div>
    );
}
