const { ethers } = require('ethers');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Register the Wallet schema
require('../models/Wallet');

// Import the Wallet model
const Wallet = mongoose.model('Wallet');

// USDT ABI (minimal for balanceOf)
const USDT_ABI = [
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];

// Network configurations
const NETWORKS = {
    ethereum: {
        name: 'Ethereum',
        rpcUrl: 'http://127.0.0.1:8545',
        chainId: 31337,
        usdtAddress: process.env.HARDHAT_USDT_ADDRESS,
        decimals: 6
    },
    bsc: {
        name: 'BSC',
        rpcUrl: 'http://127.0.0.1:8545',
        chainId: 31337,
        usdtAddress: process.env.BSC_USDT_ADDRESS,
        decimals: 6
    },
    polygon: {
        name: 'Polygon',
        rpcUrl: 'http://127.0.0.1:8545',
        chainId: 31337,
        usdtAddress: process.env.POLYGON_USDT_ADDRESS,
        decimals: 6
    },
    arbitrum: {
        name: 'Arbitrum',
        rpcUrl: 'http://127.0.0.1:8545',
        chainId: 31337,
        usdtAddress: process.env.ARBITRUM_USDT_ADDRESS,
        decimals: 6
    },
    tron: {
        name: 'TRON',
        rpcUrl: 'http://127.0.0.1:8545',
        chainId: 31337,
        usdtAddress: process.env.TRON_USDT_ADDRESS,
        decimals: 6
    },
    ton: {
        name: 'TON',
        rpcUrl: 'http://127.0.0.1:8545',
        chainId: 31337,
        usdtAddress: process.env.TON_USDT_ADDRESS,
        decimals: 6
    },
    solana: {
        name: 'Solana',
        rpcUrl: 'http://127.0.0.1:8545',
        chainId: 31337,
        usdtAddress: process.env.SOLANA_USDT_ADDRESS,
        decimals: 6
    }
};

async function main() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get the test user's wallet
        const testUserId = process.env.TEST_USER_ID;
        const wallet = await Wallet.findOne({ userId: testUserId });

        if (!wallet) {
            console.error('Test user wallet not found');
            return;
        }

        // Initialize provider
        const provider = new ethers.JsonRpcProvider(NETWORKS.ethereum.rpcUrl);
        await provider.getNetwork();
        console.log('Successfully connected to Hardhat network');

        // Print on-chain balances for each network
        for (const network of wallet.networks) {
            const networkConfig = NETWORKS[network.network];
            if (!networkConfig) {
                console.error(`Invalid network: ${network.network}`);
                continue;
            }

            const contract = new ethers.Contract(
                networkConfig.usdtAddress,
                USDT_ABI,
                provider
            );

            const balance = await contract.balanceOf(network.address);
            const formattedBalance = ethers.formatUnits(balance, networkConfig.decimals);
            console.log(`On-chain USDT balance for ${network.network}: ${formattedBalance}`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

main(); 