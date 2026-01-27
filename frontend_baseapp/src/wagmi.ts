import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

const network = import.meta.env.VITE_NETWORK || 'testnet';

// Select target chain based on environment
export const targetChain = network === 'mainnet' ? base : baseSepolia;

export const config = createConfig({
    chains: [base, baseSepolia],
    transports: {
        [base.id]: http(),
        // Use PublicNode's free RPC for Base Sepolia - no API key required
        [baseSepolia.id]: http('https://base-sepolia-rpc.publicnode.com'),
    },
});

// Export chainId for use in contract calls
export const chainId = targetChain.id;
