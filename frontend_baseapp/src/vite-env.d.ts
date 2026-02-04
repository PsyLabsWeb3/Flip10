/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PUBLIC_ONCHAINKIT_API_KEY: string;
    readonly VITE_BACKEND_URL: string;
    readonly VITE_CONTRACT_ADDRESS: string;
    readonly VITE_NETWORK: 'testnet' | 'mainnet';
    readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
