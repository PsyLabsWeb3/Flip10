import { http, createConfig } from 'wagmi'
import { base, baseSepolia, mainnet } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';
const network = import.meta.env.VITE_NETWORK || 'testnet';

// Select target chain based on environment
export const targetChain = network === 'mainnet' ? base : baseSepolia;

export const config = createConfig({
    // Include multiple chains so wallet can switch from any chain
    chains: [targetChain, mainnet, base, baseSepolia],
    connectors: [
        injected(),
        walletConnect({ projectId }),
    ],
    transports: {
        [mainnet.id]: http(),
        [base.id]: http(),
        // Use PublicNode's free RPC for Base Sepolia - no API key required
        [baseSepolia.id]: http('https://base-sepolia-rpc.publicnode.com'),
    },
})

// Export chainId for use in contract calls
export const chainId = targetChain.id;
