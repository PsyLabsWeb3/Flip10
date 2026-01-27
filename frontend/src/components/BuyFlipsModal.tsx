import React from 'react';
import { useAccount, useConnect, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useChainId } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { formatEther } from 'viem';
import { Flip10SessionsABI } from '../abis/Flip10Sessions';
import { useGameStore } from '../store/useGameStore';
import { chainId as targetChainId } from '../wagmi';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

interface FlipPackage {
    id: number;
    priceWei: bigint;
    flips: bigint;
    active: boolean;
}

export const BuyFlipsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { isConnected, address } = useAccount();
    const { connect } = useConnect();
    const { session, sendHello } = useGameStore();
    const currentChainId = useChainId();
    const { switchChainAsync } = useSwitchChain();
    const { writeContract, isPending, data: txHash, error: writeError } = useWriteContract();
    const [isSwitchingChain, setIsSwitchingChain] = React.useState(false);

    // Read package count
    const { data: packageCount } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: Flip10SessionsABI,
        functionName: 'packageCount',
        chainId: targetChainId,
    });

    // Read all packages
    const packageContracts = React.useMemo(() => {
        if (!packageCount) return [];
        return Array.from({ length: packageCount }, (_, i) => ({
            address: CONTRACT_ADDRESS,
            abi: Flip10SessionsABI,
            functionName: 'flipPackages' as const,
            args: [i] as const,
        }));
    }, [packageCount]);

    const { data: packagesData, isLoading: isLoadingPackages } = useReadContracts({
        contracts: packageContracts.map(c => ({ ...c, chainId: targetChainId })),
    });

    // Parse packages
    const packages: FlipPackage[] = React.useMemo(() => {
        if (!packagesData) return [];
        return packagesData
            .map((result, i) => {
                if (result.status !== 'success') return null;
                const [priceWei, flips, active] = result.result as [bigint, bigint, boolean];
                return { id: i, priceWei, flips, active };
            })
            .filter((pkg): pkg is FlipPackage => pkg !== null && pkg.active);
    }, [packagesData]);

    // Wait for transaction
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

    const handleBuy = async (pkg: FlipPackage) => {
        if (!session) {
            console.error('No session available');
            return;
        }

        // Switch chain if needed
        if (currentChainId !== targetChainId) {
            try {
                setIsSwitchingChain(true);
                await switchChainAsync({ chainId: targetChainId });
            } catch (error) {
                console.error('Failed to switch chain:', error);
                setIsSwitchingChain(false);
                return;
            }
            setIsSwitchingChain(false);
        }

        console.log('Buying package:', pkg.id, 'for session:', session.id, 'price:', pkg.priceWei.toString());
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: Flip10SessionsABI,
            functionName: 'buyFlips',
            args: [BigInt(session.id), pkg.id],
            value: pkg.priceWei,
            chainId: targetChainId,
        });
    };

    // Close modal on success and refresh player state
    React.useEffect(() => {
        if (isSuccess) {
            if (address) sendHello(address); // Request updated player state from server
            setTimeout(() => {
                onClose();
            }, 1500);
        }
    }, [isSuccess, onClose, sendHello]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: '420px' }}>
                <h3 style={{ marginTop: 0 }}>BUY FLIPS</h3>

                {!isConnected ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <p style={{ marginBottom: '1.5rem', color: '#666' }}>Connect your wallet to buy flips</p>
                        <button onClick={() => connect({ connector: injected() })}>Connect Wallet</button>
                    </div>
                ) : isSuccess ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <p style={{ fontWeight: 700, color: 'var(--color-success)' }}>Purchase successful!</p>
                    </div>
                ) : (
                    <>
                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                            Select a flip package to continue playing.
                        </p>

                        {isLoadingPackages ? (
                            <p style={{ textAlign: 'center', padding: '1rem' }}>Loading packages...</p>
                        ) : packages.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
                                No packages available
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {packages.map((pkg) => (
                                    <button
                                        key={pkg.id}
                                        onClick={() => handleBuy(pkg)}
                                        disabled={isPending || isConfirming || isSwitchingChain}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem 1.5rem',
                                            background: 'var(--color-white)',
                                            color: 'var(--color-black)',
                                        }}
                                    >
                                        <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>
                                            {pkg.flips.toString()} Flips
                                        </span>
                                        <span style={{ background: 'var(--color-warning)', padding: '0.25rem 0.75rem', border: '2px solid var(--color-black)' }}>
                                            {formatEther(pkg.priceWei)} ETH
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {(isPending || isConfirming || isSwitchingChain) && (
                            <p style={{ textAlign: 'center', marginTop: '1rem', fontStyle: 'italic' }}>
                                {isSwitchingChain ? 'Switching network...' : isPending ? 'Confirm in wallet...' : 'Confirming transaction...'}
                            </p>
                        )}

                        {writeError && (
                            <>
                                {console.error('Transaction error:', writeError)}
                                <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--color-error)', fontSize: '0.875rem' }}>
                                    Transaction failed. Please try again or switch to Base Sepolia network.
                                </p>
                            </>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <button onClick={onClose} className="ghost" disabled={isPending || isConfirming}>
                                Cancel
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
