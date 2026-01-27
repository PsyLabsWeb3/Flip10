export const Flip10SessionsABI = [
    // View functions
    {
        inputs: [{ name: "packageId", type: "uint8" }],
        name: "flipPackages",
        outputs: [
            { name: "priceWei", type: "uint256" },
            { name: "flips", type: "uint256" },
            { name: "active", type: "bool" }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "packageCount",
        outputs: [{ name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ name: "sessionId", type: "uint256" }],
        name: "sessions",
        outputs: [
            { name: "started", type: "bool" },
            { name: "finalized", type: "bool" },
            { name: "winner", type: "address" },
            { name: "startTime", type: "uint64" },
            { name: "endTime", type: "uint64" },
            { name: "prizePoolWei", type: "uint256" }
        ],
        stateMutability: "view",
        type: "function"
    },
    // Write functions
    {
        inputs: [
            { name: "sessionId", type: "uint256" },
            { name: "packageId", type: "uint8" }
        ],
        name: "buyFlips",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [{ name: "sessionId", type: "uint256" }],
        name: "claimPrize",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    // Events
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "sessionId", type: "uint256" },
            { indexed: true, name: "winner", type: "address" },
            { indexed: false, name: "endTime", type: "uint64" },
            { indexed: false, name: "proofHash", type: "bytes32" }
        ],
        name: "SessionFinalized",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "sessionId", type: "uint256" },
            { indexed: true, name: "winner", type: "address" },
            { indexed: false, name: "amountWei", type: "uint256" }
        ],
        name: "PrizeClaimed",
        type: "event"
    }
] as const;
