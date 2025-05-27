import { ethers } from 'ethers';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import '../models/Wallet.js';

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
        usdtAddress: process.env.BSC_USDT_ADDRESS || process.env.HARDHAT_USDT_ADDRESS, // Fallback to Hardhat USDT if BSC not configured
        decimals: 6
    },
    polygon: {
        name: 'Polygon',
        rpcUrl: process.env.POLYGON_RPC_URL || 'http://127.0.0.1:8545',
        chainId: parseInt(process.env.POLYGON_CHAIN_ID || '31337'),
        usdtAddress: process.env.POLYGON_USDT_ADDRESS || process.env.HARDHAT_USDT_ADDRESS,
        decimals: 6
    },
    arbitrum: {
        name: 'Arbitrum',
        rpcUrl: process.env.ARBITRUM_RPC_URL || 'http://127.0.0.1:8545',
        chainId: parseInt(process.env.ARBITRUM_CHAIN_ID || '31337'),
        usdtAddress: process.env.ARBITRUM_USDT_ADDRESS || process.env.HARDHAT_USDT_ADDRESS,
        decimals: 6
    },
    tron: {
        name: 'TRON',
        rpcUrl: process.env.TRON_RPC_URL || 'http://127.0.0.1:8545',
        chainId: parseInt(process.env.TRON_CHAIN_ID || '31337'),
        usdtAddress: process.env.TRON_USDT_ADDRESS || process.env.HARDHAT_USDT_ADDRESS,
        decimals: 6
    },
    ton: {
        name: 'TON',
        rpcUrl: process.env.TON_RPC_URL || 'http://127.0.0.1:8545',
        chainId: parseInt(process.env.TON_CHAIN_ID || '31337'),
        usdtAddress: process.env.TON_USDT_ADDRESS || process.env.HARDHAT_USDT_ADDRESS,
        decimals: 6
    },
    solana: {
        name: 'Solana',
        rpcUrl: process.env.SOLANA_RPC_URL || 'http://127.0.0.1:8545',
        chainId: parseInt(process.env.SOLANA_CHAIN_ID || '31337'),
        usdtAddress: process.env.SOLANA_USDT_ADDRESS || process.env.HARDHAT_USDT_ADDRESS,
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
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function mint(address to, uint256 amount)" // Assuming a mint function exists
];

const Wallet = mongoose.model('Wallet');

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

    // Add calculateTransactionFee method
    calculateTransactionFee(network) {
        const feeMap = {
            'ethereum': 2.50,
            'bsc': 0.50,
            'tron': 0.10,
            'ton': 0.05,
            'solana': 0.01,
            'polygon': 0.10,
            'arbitrum': 0.30
        };
        return feeMap[network] || 1.00; // Default to 1.00 if network not found
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
                let address, privateKey;

                switch (network) {
                    case 'ton':
                        // For TON, generate a random string that starts with EQ
                        const tonRandom = ethers.randomBytes(32);
                        const tonHex = ethers.hexlify(tonRandom);
                        // Create a TON-like address (48 chars total)
                        address = `EQ${tonHex.slice(2, 48)}`;
                        privateKey = tonHex;
                        break;

                    case 'tron':
                        // For TRON, generate a random string that starts with T
                        const tronRandom = ethers.randomBytes(21);
                        const tronHex = ethers.hexlify(tronRandom);
                        // Create a TRON-like address (34 chars total)
                        address = `T${tronHex.slice(2, 35)}`;
                        privateKey = tronHex;
                        break;

                    case 'solana':
                        // For Solana, generate a random string
                        const solRandom = ethers.randomBytes(32);
                        const solHex = ethers.hexlify(solRandom);
                        // Create a Solana-like address (44 chars)
                        address = solHex.slice(2, 46);
                        privateKey = solHex;
                        break;

                    default:
                        // For EVM chains (Ethereum, BSC, etc.), use ethers wallet
                        const evmWallet = ethers.Wallet.createRandom();
                        address = evmWallet.address;
                        privateKey = evmWallet.privateKey;
                }

                return {
                    network,
                    address,
                    privateKey,
                    balance: '0',
                    isActive: true
                };
            });

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
                console.warn(`[getBalance] Invalid network configuration or missing USDT address for ${network}`);
                return '0'; // Return 0 if config is invalid
            }
            console.log(`[getBalance] Using USDT address: ${config.usdtAddress} and provider for ${network}`);

            // Check if contract exists at the address
            const code = await this.providers[network].getCode(config.usdtAddress);
            if (code === '0x') {
                console.warn(`[getBalance] No contract found at address ${config.usdtAddress} on ${network}`);
                return '0';
            }

            // Create contract instance
            const contract = new ethers.Contract(
                config.usdtAddress,
                USDT_ABI,
                this.providers[network]
            );

            console.log(`[getBalance] Calling balanceOf for ${address} on ${network} contract ${config.usdtAddress}`);
            const balance = await contract.balanceOf(address);
            console.log(`[getBalance] Raw balance response for ${address} on ${network}:`, balance);
            return ethers.formatUnits(balance, config.decimals);
        } catch (error) {
            console.error(`[getBalance] Error getting balance for ${network}:`, error);
            // Return 0 instead of throwing for better UX
            return '0';
        }
    }

    async handleIncomingUSDT(network, address, amount) {
        try {
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

    async sendUSDT(fromAddress, toAddress, amount, network) {
        try {
            console.log(`[sendUSDT] Starting USDT transfer:`, {
                fromAddress,
                toAddress,
                amount,
                network
            });

            // Get the sender's wallet
            const senderWallet = await Wallet.findOne({ address: fromAddress });
            if (!senderWallet) {
                throw new Error('Sender wallet not found');
            }

            // Calculate transaction fee based on network
            const feeAmount = this.calculateTransactionFee(network);
            console.log(`[sendUSDT] Calculated fee for ${network}:`, feeAmount);

            // Check if sender has enough balance
            const currentBalance = parseFloat(senderWallet.globalUsdtBalance || '0');
            const totalAmount = parseFloat(amount) + feeAmount;

            if (currentBalance < totalAmount) {
                console.log(`[sendUSDT] Insufficient balance:`, {
                    currentBalance,
                    required: totalAmount
                });
                throw new Error('Insufficient USDT balance');
            }

            // Deduct amount and fee from sender's global balance
            const newGlobalBalance = (currentBalance - totalAmount).toFixed(6);
            senderWallet.globalUsdtBalance = newGlobalBalance;
            await senderWallet.save();
            console.log(`[sendUSDT] Updated sender's global balance to ${newGlobalBalance}`);

            // Handle different networks
            switch (network) {
                case 'ton':
                    // For TON, validate the address format
                    console.log(`[sendUSDT] Validating TON address: ${toAddress} (length: ${toAddress.length})`);

                    // Check if address starts with EQ or UQ
                    if (!toAddress.startsWith('EQ') && !toAddress.startsWith('UQ')) {
                        console.log(`[sendUSDT] TON address must start with EQ or UQ`);
                        throw new Error('Invalid TON address format. TON addresses should start with EQ or UQ.');
                    }

                    // Check total length
                    if (toAddress.length !== 48) {
                        console.log(`[sendUSDT] TON address must be 48 characters long`);
                        throw new Error('Invalid TON address format. TON addresses should be 48 characters long.');
                    }

                    // Check if remaining characters are valid base64url characters
                    const remainingChars = toAddress.slice(2);
                    if (!/^[a-zA-Z0-9_-]{46}$/.test(remainingChars)) {
                        console.log(`[sendUSDT] TON address contains invalid characters`);
                        throw new Error('Invalid TON address format. TON addresses should only contain valid base64url characters.');
                    }

                    console.log(`[sendUSDT] TON address validation passed for: ${toAddress}`);

                    // For TON, we'll simulate the transfer since we're using Hardhat nodes
                    console.log(`[sendUSDT] Simulating TON transfer of ${amount} USDT to ${toAddress}`);

                    // Update recipient's global balance if their wallet exists
                    const tonRecipientWallet = await Wallet.findOne({ 'networks.address': toAddress });
                    if (tonRecipientWallet) {
                        const recipientBalance = parseFloat(tonRecipientWallet.globalUsdtBalance || '0');
                        tonRecipientWallet.globalUsdtBalance = (recipientBalance + parseFloat(amount)).toFixed(6);
                        await tonRecipientWallet.save();
                        console.log(`[sendUSDT] Updated recipient's global balance to ${tonRecipientWallet.globalUsdtBalance}`);
                    }

                    // Generate a mock transaction hash for TON
                    const tonMockTxHash = `ton_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

                    return {
                        success: true,
                        txHash: tonMockTxHash,
                        blockNumber: Date.now(),
                        newBalance: newGlobalBalance,
                        feeAmount: feeAmount
                    };

                case 'tron':
                    // For TRON, validate the address format
                    // TRON addresses are typically in the format: T... (base58 encoded)
                    if (!toAddress.match(/^T[A-Za-z1-9]{33}$/)) {
                        throw new Error('Invalid TRON address format. TRON addresses should start with T and be 34 characters long.');
                    }

                    // For TRON, we'll simulate the transfer since we're using Hardhat nodes
                    console.log(`[sendUSDT] Simulating TRON transfer of ${amount} USDT to ${toAddress}`);

                    // Update recipient's global balance if their wallet exists
                    const tronRecipientWallet = await Wallet.findOne({ 'networks.address': toAddress });
                    if (tronRecipientWallet) {
                        const recipientBalance = parseFloat(tronRecipientWallet.globalUsdtBalance || '0');
                        tronRecipientWallet.globalUsdtBalance = (recipientBalance + parseFloat(amount)).toFixed(6);
                        await tronRecipientWallet.save();
                        console.log(`[sendUSDT] Updated recipient's global balance to ${tronRecipientWallet.globalUsdtBalance}`);
                    }

                    // Generate a mock transaction hash for TRON
                    const tronMockTxHash = `trx_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

                    return {
                        success: true,
                        txHash: tronMockTxHash,
                        blockNumber: Date.now(),
                        newBalance: newGlobalBalance,
                        feeAmount: feeAmount
                    };

                case 'solana':
                    // For Solana, validate the address format
                    // Solana addresses are typically in the format: base58 encoded, 32-44 characters
                    if (!toAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
                        throw new Error('Invalid Solana address format. Solana addresses should be base58 encoded and 32-44 characters long.');
                    }

                    // For Solana, we'll just update the balances without actual blockchain interaction
                    console.log(`[sendUSDT] Simulating Solana transfer of ${amount} USDT to ${toAddress}`);

                    // Update recipient's global balance if their wallet exists
                    const recipientWallet = await Wallet.findOne({ 'networks.address': toAddress });
                    if (recipientWallet) {
                        const recipientBalance = parseFloat(recipientWallet.globalUsdtBalance || '0');
                        recipientWallet.globalUsdtBalance = (recipientBalance + parseFloat(amount)).toFixed(6);
                        await recipientWallet.save();
                        console.log(`[sendUSDT] Updated recipient's global balance to ${recipientWallet.globalUsdtBalance}`);
                    }

                    // Generate a mock transaction hash for Solana
                    const mockTxHash = `sol_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

                    return {
                        success: true,
                        txHash: mockTxHash,
                        blockNumber: Date.now(),
                        newBalance: newGlobalBalance,
                        feeAmount: feeAmount
                    };

                default:
                    // For EVM chains (Ethereum, BSC, etc.), validate the address format
                    try {
                        ethers.getAddress(toAddress); // This will throw if the address is invalid
                    } catch (error) {
                        throw new Error('Invalid EVM address format. Address should be a valid Ethereum address.');
                    }

                    // For EVM chains (Ethereum, BSC, etc.)
                    const backendPrivateKey = process.env.BACKEND_HOT_WALLET_PRIVATE_KEY;
                    if (!backendPrivateKey) {
                        throw new Error('Backend hot wallet private key not configured');
                    }

                    // Initialize provider if not already done
                    if (!this.providers[network]) {
                        await this.initializeProviders();
                    }

                    // Create backend wallet instance
                    const backendWallet = new ethers.Wallet(backendPrivateKey, this.providers[network]);
                    console.log(`[sendUSDT] Using backend wallet: ${backendWallet.address}`);

                    // Get USDT contract
                    const config = NETWORKS[network];
                    if (!config || !config.usdtAddress) {
                        throw new Error(`USDT contract address not configured for ${network}`);
                    }

                    // Validate USDT contract address
                    try {
                        const code = await this.providers[network].getCode(config.usdtAddress);
                        if (code === '0x') {
                            throw new Error(`No contract found at address ${config.usdtAddress}`);
                        }
                    } catch (error) {
                        console.error(`[sendUSDT] Error validating USDT contract:`, error);
                        throw new Error(`Failed to validate USDT contract: ${error.message}`);
                    }

                    // Create contract instance with error handling
                    let contract;
                    try {
                        contract = new ethers.Contract(
                            config.usdtAddress,
                            USDT_ABI,
                            backendWallet
                        );
                    } catch (error) {
                        console.error(`[sendUSDT] Error creating contract instance:`, error);
                        throw new Error(`Failed to create USDT contract instance: ${error.message}`);
                    }

                    // Validate contract interface
                    try {
                        await contract.decimals();
                    } catch (error) {
                        console.error(`[sendUSDT] Error validating contract interface:`, error);
                        throw new Error(`Invalid USDT contract interface: ${error.message}`);
                    }

                    // Check backend wallet's USDT balance with error handling
                    let backendBalance;
                    try {
                        backendBalance = await contract.balanceOf(backendWallet.address);
                    } catch (error) {
                        console.error(`[sendUSDT] Error checking backend wallet balance:`, error);
                        throw new Error(`Failed to check backend wallet balance: ${error.message}`);
                    }

                    const minRequiredBalance = ethers.parseUnits('1000', config.decimals);

                    // If backend wallet doesn't have enough USDT, mint some
                    if (backendBalance < minRequiredBalance) {
                        console.log(`[sendUSDT] Backend wallet needs more USDT. Current balance: ${ethers.formatUnits(backendBalance, config.decimals)}`);
                        try {
                            const mintTx = await contract.mint(backendWallet.address, minRequiredBalance);
                            await mintTx.wait();
                            console.log(`[sendUSDT] Minted USDT to backend wallet`);
                        } catch (error) {
                            console.error(`[sendUSDT] Error minting USDT:`, error);
                            throw new Error(`Failed to mint USDT: ${error.message}`);
                        }
                    }

                    // Send USDT to recipient with error handling
                    try {
                        const amountInWei = ethers.parseUnits(amount.toString(), config.decimals);
                        const tx = await contract.transfer(toAddress, amountInWei);
                        console.log(`[sendUSDT] Transaction sent: ${tx.hash}`);

                        // Wait for transaction to be mined
                        const receipt = await tx.wait();
                        console.log(`[sendUSDT] Transaction mined in block ${receipt.blockNumber}`);

                        // Update recipient's global balance if their wallet exists
                        const recipientWallet = await Wallet.findOne({ 'networks.address': toAddress });
                        if (recipientWallet) {
                            const recipientBalance = parseFloat(recipientWallet.globalUsdtBalance || '0');
                            recipientWallet.globalUsdtBalance = (recipientBalance + parseFloat(amount)).toFixed(6);
                            await recipientWallet.save();
                            console.log(`[sendUSDT] Updated recipient's global balance to ${recipientWallet.globalUsdtBalance}`);
                        }

                        return {
                            success: true,
                            txHash: tx.hash,
                            blockNumber: receipt.blockNumber,
                            newBalance: newGlobalBalance,
                            feeAmount: feeAmount
                        };
                    } catch (error) {
                        console.error(`[sendUSDT] Error sending USDT:`, error);
                        throw new Error(`Failed to send USDT: ${error.message}`);
                    }
            }
        } catch (error) {
            console.error(`[sendUSDT] Error:`, error);
            throw error;
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
            console.log(`[mintTestUSDT] Starting test USDT mint for ${address} on ${network}`);

            // Get backend hot wallet private key
            const backendPrivateKey = process.env.BACKEND_HOT_WALLET_PRIVATE_KEY;
            if (!backendPrivateKey) {
                throw new Error('Backend hot wallet private key not configured');
            }

            // Initialize provider if not already done
            if (!this.providers[network]) {
                await this.initializeProviders();
            }

            // Create backend wallet instance
            const backendWallet = new ethers.Wallet(backendPrivateKey, this.providers[network]);
            console.log(`[mintTestUSDT] Using backend wallet: ${backendWallet.address}`);

            // Get USDT contract
            const config = NETWORKS[network];
            const contract = new ethers.Contract(
                config.usdtAddress,
                USDT_ABI,
                backendWallet
            );

            // Mint USDT to backend wallet first
            const mintAmount = ethers.parseUnits('1000', config.decimals);
            console.log(`[mintTestUSDT] Minting ${ethers.formatUnits(mintAmount, config.decimals)} USDT to backend wallet`);
            const mintTx = await contract.mint(backendWallet.address, mintAmount);
            await mintTx.wait();
            console.log(`[mintTestUSDT] Minted USDT to backend wallet`);

            // Transfer USDT to user's address
            const transferAmount = ethers.parseUnits('100', config.decimals);
            console.log(`[mintTestUSDT] Transferring ${ethers.formatUnits(transferAmount, config.decimals)} USDT to ${address}`);
            const transferTx = await contract.transfer(address, transferAmount);
            const transferReceipt = await transferTx.wait();
            console.log(`[mintTestUSDT] Transfer completed in block ${transferReceipt.blockNumber}`);

            // Update wallet's global balance
            const wallet = await Wallet.findOne({ 'networks.address': address });
            if (wallet) {
                const currentBalance = parseFloat(wallet.globalUsdtBalance || '0');
                const newBalance = (currentBalance + 100).toFixed(6); // Add 100 USDT to global balance
                wallet.globalUsdtBalance = newBalance;
                await wallet.save();
                console.log(`[mintTestUSDT] Updated wallet's global balance to ${newBalance} USDT`);
            }

            return {
                success: true,
                txHash: transferTx.hash,
                blockNumber: transferReceipt.blockNumber,
                balance: '100.000000'
            };
        } catch (error) {
            console.error(`[mintTestUSDT] Error:`, error);
            throw error;
        }
    }

    async mintInitialUSDT(req, res) { /* ... existing code ... */ }
}

export default new WalletService(); 