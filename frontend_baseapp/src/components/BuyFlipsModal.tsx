import React, { useMemo } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { formatEther } from 'viem';
import {
    Transaction,
    TransactionButton,
    TransactionStatus,
    TransactionStatusLabel,
    TransactionStatusAction,
    TransactionToast,
    TransactionToastIcon,
    TransactionToastLabel,
    TransactionToastAction
} from '@coinbase/onchainkit/transaction';
import type { LifecycleStatus } from '@coinbase/onchainkit/transaction';
import { Flip10SessionsABI } from '../abis/Flip10Sessions';
import { useGameStore } from '../store/useGameStore';
import { chainId as targetChainId } from '../wagmi';
import { playButtonPress, playButtonRelease } from '../utils/sfx';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

interface FlipPackage {
    id: number;
    priceWei: bigint;
    flips: bigint;
    active: boolean;
}

export const BuyFlipsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { isConnected, address } = useAccount();
    const { session, sendHello } = useGameStore();

    // Read package count
    const { data: packageCount } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: Flip10SessionsABI,
        functionName: 'packageCount',
        chainId: targetChainId,
    });

    // Read all packages
    const packageContracts = useMemo(() => {
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
    const packages: FlipPackage[] = useMemo(() => {
        if (!packagesData) return [];
        return packagesData
            .map((result, i) => {
                if (result.status !== 'success') return null;
                const [priceWei, flips, active] = result.result as [bigint, bigint, boolean];
                return { id: i, priceWei, flips, active };
            })
            .filter((pkg): pkg is FlipPackage => pkg !== null && pkg.active);
    }, [packagesData]);

    const handleOnStatus = (status: LifecycleStatus) => {
        console.log('Transaction status:', status);
        if (status.statusName === 'success') {
            setTimeout(() => {
                if (address) sendHello(address); // Request updated player state
                onClose();
            }, 1500);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: 'min(420px, 90vw)' }}>
                <h3 style={{ marginTop: 0 }}>BUY FLIPS</h3>

                {!isConnected ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <p style={{ marginBottom: '1.5rem', color: '#666' }}>Connect your wallet to buy flips</p>
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
                                    <Transaction
                                        key={pkg.id}
                                        chainId={targetChainId}
                                        calls={[{
                                            address: CONTRACT_ADDRESS,
                                            abi: Flip10SessionsABI,
                                            functionName: 'buyFlips',
                                            args: [BigInt(session?.id || 0), pkg.id],
                                            value: pkg.priceWei,
                                        }]}
                                        onStatus={handleOnStatus}
                                    >
                                        <TransactionButton
                                            text={`${pkg.flips} Flips - ${formatEther(pkg.priceWei)} ETH`}
                                            className="w-full !justify-between !px-6 !py-4 !bg-white !text-black !font-bold !border-[3px] !border-black !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:!translate-x-[2px] hover:!translate-y-[2px] active:!translate-x-[4px] active:!translate-y-[4px] !rounded-none"
                                        />
                                        <TransactionStatus>
                                            <TransactionStatusLabel />
                                            <TransactionStatusAction />
                                        </TransactionStatus>
                                        <TransactionToast>
                                            <TransactionToastIcon />
                                            <TransactionToastLabel />
                                            <TransactionToastAction />
                                        </TransactionToast>
                                    </Transaction>
                                ))}
                            </div>
                        )}

                        <p style={{ color: '#666', marginTop: '1.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                            * Flips purchased are only valid for this match.
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <button onMouseDown={playButtonPress} onMouseUp={playButtonRelease} onClick={onClose} className="ghost">
                                Cancel
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
