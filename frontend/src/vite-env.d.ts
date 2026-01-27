/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_WALLET_CONNECT_PROJECT_ID: string
    readonly VITE_CONTRACT_ADDRESS: string
    readonly VITE_BACKEND_URL: string
    readonly VITE_NETWORK: 'mainnet' | 'testnet'
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
