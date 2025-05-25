import { ethers } from 'ethers';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Helper function to parse RPC URLs
function parseRpcUrl(url) {
    if (!url) return null;
    // Split by comma and return the first URL if multiple are provided
    const urls = url.split(',').map(u => u.trim());
    return urls[0];
}

// Helper function to validate RPC URL
function validateRpcUrl(url) {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ws://') || url.startsWith('wss://');
}

// Helper function to ensure RPC URL format
function ensureRpcUrl(url) {
    if (!url) return null;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('ws://') && !url.startsWith('wss://')) {
        return `http://${url}`;
    }
    return url;
}

// Network configurations - reads from .env on load
const NETWORKS = {
    ethereum: {
        name: 'Ethereum',
        rpcUrl: process.env.HARDHAT_RPC_URL || 'http://127.0.0.1:8545',
        chainId: parseInt(process.env.HARDHAT_CHAIN_ID || '31337'),
        usdtAddress: process.env.HARDHAT_USDT_ADDRESS,
        decimals: 6
    },
    bsc: {
        name: 'BSC',
        rpcUrl: process.env.BSC_RPC_URL || 'http://127.0.0.1:8545',
        chainId: parseInt(process.env.BSC_CHAIN_ID || '31337'),
        usdtAddress: process.env.BSC_USDT_ADDRESS,
        decimals: 6
    },
    polygon: {
        name: 'Polygon',
        rpcUrl: process.env.POLYGON_RPC_URL || 'http://127.0.0.1:8545',
        chainId: parseInt(process.env.POLYGON_CHAIN_ID || '31337'),
        usdtAddress: process.env.POLYGON_USDT_ADDRESS,
        decimals: 6
    },
    arbitrum: {
        name: 'Arbitrum',
        rpcUrl: process.env.ARBITRUM_RPC_URL || 'http://127.0.0.1:8545',
        chainId: parseInt(process.env.ARBITRUM_CHAIN_ID || '31337'),
        usdtAddress: process.env.ARBITRUM_USDT_ADDRESS,
        decimals: 6
    },
    tron: {
        name: 'TRON',
        rpcUrl: process.env.TRON_RPC_URL || 'http://127.0.0.1:8545',
        chainId: parseInt(process.env.TRON_CHAIN_ID || '31337'),
        usdtAddress: process.env.TRON_USDT_ADDRESS,
        decimals: 6
    },
    ton: {
        name: 'TON',
        rpcUrl: process.env.TON_RPC_URL || 'http://127.0.0.1:8545',
        chainId: parseInt(process.env.TON_CHAIN_ID || '31337'),
        usdtAddress: process.env.TON_USDT_ADDRESS,
        decimals: 6
    },
    solana: {
        name: 'Solana',
        rpcUrl: process.env.SOLANA_RPC_URL || 'http://127.0.0.1:8545',
        chainId: parseInt(process.env.SOLANA_CHAIN_ID || '31337'),
        usdtAddress: process.env.SOLANA_USDT_ADDRESS,
        decimals: 6
    }
};

// Initialize providers for each network
const providers = {};
async function initializeProviders() {
    try {
        console.log('Initializing providers...');
        for (const [network, config] of Object.entries(NETWORKS)) {
            // Ensure RPC URL is valid
            const rpcUrl = ensureRpcUrl(config.rpcUrl);
            if (!rpcUrl || !validateRpcUrl(rpcUrl)) {
                console.warn(`Invalid or missing RPC URL for ${network}: ${config.rpcUrl}`);
                continue;
            }

            try {
                providers[network] = new ethers.JsonRpcProvider(rpcUrl);
                // Test the connection
                const networkDetails = await providers[network].getNetwork();

                // Validate chain ID if provided in config and not 31337 (Hardhat default)
                if (config.chainId && config.chainId !== 31337 && networkDetails.chainId !== BigInt(config.chainId)) {
                    console.warn(`Chain ID mismatch for ${network}: config=${config.chainId}, provider=${networkDetails.chainId}`);
                    // Optionally, decide to not use this provider if chain ID doesn't match
                    // delete providers[network];
                    // continue;
                }

                console.log(`Successfully connected to ${network} network (Chain ID: ${networkDetails.chainId})`);

                // Check if USDT address is set and checksum it
                if (config.usdtAddress) {
                    try {
                        config.usdtAddress = ethers.getAddress(config.usdtAddress);
                    } catch (e) {
                        console.warn(`Invalid USDT address for ${network}: ${config.usdtAddress}. Error: ${e.message}`);
                        // Optionally, decide to not use this provider if address is invalid
                        // delete providers[network];
                        // continue;
                    }
                } else {
                    console.warn(`${network.toUpperCase()}_USDT_ADDRESS environment variable is not set`);
                }

            } catch (error) {
                console.error(`Failed to connect to ${network} network at ${rpcUrl}:`, error.message);
                // Remove the provider if connection fails
                delete providers[network];
            }
        }
        console.log('Provider initialization complete.');
    } catch (error) {
        console.error('Error during provider initialization:', error);
        throw new Error('Failed during network provider setup.');
    }
}

// Initialize providers immediately - catches error if Hardhat node is not running on backend startup
// initializeProviders().catch(console.error);

// USDT ABI (minimal for transfers) - Consider reading from artifact for full ABI
const USDT_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

class WalletService {
    constructor() {
        this.providers = {};
        // Initialize providers only when needed or explicitly called
        // this.initializeProviders();
    }

    async initializeProviders() {
        await initializeProviders();
        // Copy initialized providers to the instance
        for (const network in providers) {
            this.providers[network] = providers[network];
        }
    }

    async createWallet(userId) {
        try {
            // Check if MongoDB is connected
            if (mongoose.connection.readyState !== 1) {
                throw new Error('Database not connected');
            }

            // Check if user exists
            const User = mongoose.model('User');
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Ensure providers are initialized
            if (!this.providers.ethereum) {
                await this.initializeProviders();
            }

            // Test provider connection for ethereum (Hardhat)
            try {
                await this.providers.ethereum.getNetwork();
            } catch (error) {
                throw new Error('Failed to connect to Hardhat network. Please ensure Hardhat node is running.');
            }

            // Generate new wallet using ethers
            const wallet = ethers.Wallet.createRandom();
            const address = wallet.address;

            // Get the first Hardhat account to fund the new wallet
            // This assumes Hardhat's default accounts and private key
            const fundingPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
            const fundingAccount = new ethers.Wallet(fundingPrivateKey, this.providers.ethereum);

            // Check funding account balance (optional but good practice)
            // const fundingBalance = await this.providers.ethereum.getBalance(fundingAccount.address);
            // console.log(`Funding account balance: ${ethers.formatEther(fundingBalance)} ETH`);

            // Fund the new wallet with 1 ETH
            console.log(`Funding new wallet ${address} with 1 ETH from ${fundingAccount.address}...`);
            const fundingTx = await fundingAccount.sendTransaction({
                to: address,
                value: ethers.parseEther('1'),
                gasLimit: 21000 // Standard gas limit for ETH transfers
            });

            console.log(`Funding transaction hash: ${fundingTx.hash}`);
            await fundingTx.wait();
            console.log('Funding transaction confirmed.');

            // Create wallet document in database
            const supportedNetworks = [
                'ethereum',
                'bsc',
                'tron',
                'ton',
                'solana',
                'polygon',
                'arbitrum'
            ];

            const networks = supportedNetworks.map(network => {
                // Generate a unique address/private key pair for each network
                // This is safer than reusing the same private key across different chains
                const networkWallet = ethers.Wallet.createRandom();
                return {
                    network,
                    address: networkWallet.address,
                    privateKey: networkWallet.privateKey,
                    balance: '0',
                    isActive: true
                };
            });

            const Wallet = mongoose.model('Wallet');
            const walletDoc = await Wallet.create({
                userId,
                // Use the generated address/private key for the 'ethereum' network as the main one
                address: networks.find(n => n.network === 'ethereum').address,
                privateKey: networks.find(n => n.network === 'ethereum').privateKey,
                networks,
                isFrozen: false,
                createdAt: new Date()
            });

            console.log('Wallet document created in database.');

            return {
                address: walletDoc.address,
                networks: walletDoc.networks,
                fundingTx: fundingTx.hash
            };
        } catch (error) {
            console.error('Error creating wallet:', error);
            if (error.message === 'Database not connected') {
                throw new Error('Database connection error. Please try again later.');
            }
            if (error.message === 'User not found') {
                throw new Error('User not found');
            }
            if (error.message.includes('Failed to connect to Hardhat')) {
                throw new Error('Hardhat connection failed. Please ensure Hardhat node is running.');
            }
            throw new Error('Failed to create wallet');
        }
    }

    async getBalance(network, address) {
        try {
            console.log(`[getBalance] Attempting to get balance for ${address} on ${network}`);
            if (!this.providers[network]) {
                await this.initializeProviders(); // Ensure providers are initialized if not already
                if (!this.providers[network]) {
                    throw new Error(`Provider still not initialized for network: ${network}`);
                }
            }

            const config = NETWORKS[network];
            if (!config || !config.usdtAddress) {
                // This case should be caught during provider initialization, but adding a check here too
                console.warn(`[getBalance] Invalid network configuration or missing USDT address for ${network}`);
                return '0'; // Return 0 if config is invalid
            }
            console.log(`[getBalance] Using USDT address: ${config.usdtAddress} and provider for ${network}`);

            // Read the full ABI from the artifact file dynamically if needed, or ensure USDT_ABI is complete
            // For now, using the hardcoded ABI at the top
            const contract = new ethers.Contract(
                config.usdtAddress,
                USDT_ABI, // Ensure this ABI is complete and correct
                this.providers[network]
            );

            // Check if contract code exists at the address (optional but helpful for debugging)
            // const code = await this.providers[network].getCode(config.usdtAddress);
            // if (code === '0x') {
            //     console.warn(`[getBalance] No contract code found at address ${config.usdtAddress} on ${network}.`);
            //     return '0'; // Return 0 if no contract code
            // }

            console.log(`[getBalance] Calling balanceOf for ${address} on ${network} contract ${config.usdtAddress}`);
            const balance = await contract.balanceOf(address);
            console.log(`[getBalance] Raw balance response for ${address} on ${network}:`, balance);
            return ethers.formatUnits(balance, config.decimals);
        } catch (error) {
            console.error(`[getBalance] Error getting balance for ${network}:`, error);
            throw error; // Re-throw the error so the caller knows it failed
        }
    }

    async handleIncomingUSDT(network, address, amount) {
        try {
            const Wallet = mongoose.model('Wallet');
            const wallet = await Wallet.findOne({ 'networks.address': address });

            if (wallet) {
                console.log(`Handling incoming ${amount} USDT for wallet ${wallet.address} on ${network}`);
                // Update the global USDT balance
                const currentGlobalBalance = parseFloat(wallet.globalUsdtBalance || '0');
                const newGlobalBalance = (currentGlobalBalance + parseFloat(amount)).toFixed(6);
                wallet.globalUsdtBalance = newGlobalBalance;

                // Update the network-specific balance
                const networkIndex = wallet.networks.findIndex(n => n.network === network);
                if (networkIndex !== -1) {
                    const currentBalance = parseFloat(wallet.networks[networkIndex].balance);
                    const newBalance = (currentBalance + parseFloat(amount)).toFixed(6);
                    wallet.networks[networkIndex].balance = newBalance;
                    console.log(`Updated network balance for ${network} from ${currentBalance} to ${newBalance}`);
                }

                await wallet.save();
                console.log(`Updated global balance to ${newGlobalBalance} USDT and saved wallet document.`);
            }
        } catch (error) {
            console.error('Error handling incoming USDT:', error);
            // Decide how to handle this error - maybe log and don't re-throw if it shouldn't stop the process
            throw error;
        }
    }

    async sendUSDT(network, fromAddress, toAddress, amount, privateKey) {
        try {
            console.log(`[sendUSDT] Attempting to send ${amount} USDT from ${fromAddress} to ${toAddress} on ${network}`);

            if (!this.providers[network]) {
                await this.initializeProviders();
                if (!this.providers[network]) {
                    throw new Error(`Provider still not initialized for network: ${network} during send`);
                }
            }

            const config = NETWORKS[network];
            if (!config || !config.usdtAddress) {
                throw new Error(`Invalid network configuration or missing USDT address for ${network}`);
            }

            // Ensure the sender address matches one of the wallet's network addresses
            const Wallet = mongoose.model('Wallet');
            const wallet = await Wallet.findOne({ 'networks.address': fromAddress });

            if (!wallet || wallet.privateKey !== privateKey) {
                throw new Error('Invalid sender wallet or private key.');
            }

            // Get a signer for the sending address using the provided private key
            const senderWallet = new ethers.Wallet(privateKey, this.providers[network]);
            console.log(`[sendUSDT] Using sender address: ${senderWallet.address}`);

            // Create contract instance with the sender's signer
            const contract = new ethers.Contract(
                config.usdtAddress,
                USDT_ABI, // Ensure this ABI is complete and correct for transfer
                senderWallet
            );

            // Convert amount to the correct units (e.g., Wei for ERC20 with 18 decimals, Mwei for USDT with 6)
            const amountWei = ethers.parseUnits(amount.toString(), config.decimals);
            console.log(`[sendUSDT] Sending amount in units: ${amountWei}`);

            // Estimate gas (optional but recommended)
            // const gasEstimate = await contract.estimateGas.transfer(toAddress, amountWei);
            // console.log(`[sendUSDT] Estimated gas: ${gasEstimate}`);

            // Send the transaction
            const tx = await contract.transfer(toAddress, amountWei);
            console.log(`[sendUSDT] Transaction sent: ${tx.hash}`);

            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            console.log(`[sendUSDT] Transaction mined in block ${receipt.blockNumber}`);

            return tx.hash; // Return the transaction hash

        } catch (error) {
            console.error(`[sendUSDT] Error sending USDT on ${network}:`, error);
            throw error; // Re-throw the error
        }
    }

    async freezeWallet(userId) {
        try {
            const wallet = await mongoose.model('Wallet').findOne({ userId });
            if (!wallet) throw new Error('Wallet not found');

            wallet.isFrozen = true;
            await wallet.save();

            return true;
        } catch (error) {
            console.error('Error freezing wallet:', error);
            throw new Error('Failed to freeze wallet');
        }
    }

    async unfreezeWallet(userId) {
        try {
            const wallet = await mongoose.model('Wallet').findOne({ userId });
            if (!wallet) throw new Error('Wallet not found');

            wallet.isFrozen = false;
            await wallet.save();

            return true;
        } catch (error) {
            console.error('Error unfreezing wallet:', error);
            throw new Error('Failed to unfreeze wallet');
        }
    }

    async topUpWallet(req, res) { /* ... existing code ... */ }

    async mintTestUSDT(network, address) {
        try {
            console.log(`[mintTestUSDT] Attempting to mint for ${address} on ${network}`);
            if (!this.providers[network]) {
                await this.initializeProviders();
                if (!this.providers[network]) {
                    throw new Error(`Provider still not initialized for network: ${network} during mint`);
                }
            }

            const networkConfig = NETWORKS[network];
            if (!networkConfig || !networkConfig.usdtAddress) {
                throw new Error(`Invalid network configuration or missing USDT address for ${network}`);
            }

            // Use the first Hardhat account's private key as the minter
            const minterPrivateKey = process.env.HARDHAT_ACCOUNT_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

            const signer = new ethers.Wallet(minterPrivateKey, this.providers[network]);
            console.log(`[mintTestUSDT] Using minter address: ${signer.address}`);
            console.log(`[mintTestUSDT] Targeting contract address: ${networkConfig.usdtAddress}`);

            // Ensure the ABI includes the mint function
            const contract = new ethers.Contract(
                networkConfig.usdtAddress,
                USDT_ABI, // Ensure this ABI includes the mint function
                signer
            );

            // Check if the mint function exists in the ABI (optional)
            if (!contract.mint) {
                console.error(`[mintTestUSDT] Error: Mint function not found in contract ABI for ${network}.`);
                throw new Error('Mint function not available on contract');
            }

            const amountToMint = ethers.parseUnits("50", networkConfig.decimals);
            console.log(`[mintTestUSDT] Minting amount in units: ${amountToMint}`);

            console.log(`[mintTestUSDT] Sending mint transaction to ${networkConfig.usdtAddress}...`);
            const tx = await contract.mint(address, amountToMint);
            console.log(`[mintTestUSDT] Mint transaction sent: ${tx.hash}`);

            const receipt = await tx.wait();
            console.log(`[mintTestUSDT] Mint transaction mined in block ${receipt.blockNumber}`);

            // *** Add balance checks immediately after mining ***
            console.log(`[mintTestUSDT] Checking balance for ${address} immediately after mining...`);
            try {
                const balanceImmediatelyAfter = await contract.balanceOf(address);
                console.log(`[mintTestUSDT] Balance immediately after mining: ${ethers.formatUnits(balanceImmediatelyAfter, networkConfig.decimals)} USDT`);
            } catch (balanceError) {
                console.error(`[mintTestUSDT] Error checking balance immediately after mining:`, balanceError);
            }

            // Add a short delay
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
            console.log(`[mintTestUSDT] Delayed for 2 seconds. Checking balance again...`);

            try {
                const balanceAfterDelay = await contract.balanceOf(address);
                console.log(`[mintTestUSDT] Balance after 2-second delay: ${ethers.formatUnits(balanceAfterDelay, networkConfig.decimals)} USDT`);
            } catch (balanceError) {
                console.error(`[mintTestUSDT] Error checking balance after delay:`, balanceError);
            }

            console.log(`Successfully minted ${ethers.formatUnits(amountToMint, networkConfig.decimals)} USDT for ${network} to ${address}`);
            return true; // Indicate success

        } catch (error) {
            console.error(`[mintTestUSDT] Error minting USDT for ${network}:`, error);
            // Decide how to handle this error - maybe log and don't re-throw if it shouldn't stop the process
            throw error; // Re-throw the error
        }
    }

    async mintInitialUSDT(req, res) { /* ... existing code ... */ }
}

export default new WalletService(); 