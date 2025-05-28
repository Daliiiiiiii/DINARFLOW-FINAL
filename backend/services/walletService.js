import { ethers } from 'ethers';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import '../models/Wallet.js';
import '../models/Transaction.js';

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
const Transaction = mongoose.model('Transaction');

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

            // Generate a single EVM wallet that will be used for all EVM chains
            const evmWallet = ethers.Wallet.createRandom();
            const evmAddress = evmWallet.address;
            const evmPrivateKey = evmWallet.privateKey;

            // Get the first Hardhat account to fund the new wallet
            const fundingPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
            const fundingAccount = new ethers.Wallet(fundingPrivateKey, this.providers.ethereum);

            // Fund the new wallet with 1 ETH
            console.log(`Funding new wallet ${evmAddress} with 1 ETH from ${fundingAccount.address}...`);
            const fundingTx = await fundingAccount.sendTransaction({
                to: evmAddress,
                value: ethers.parseEther('1'),
                gasLimit: 21000
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
                    case 'ethereum':
                    case 'bsc':
                    case 'polygon':
                    case 'arbitrum':
                        // Use the same EVM wallet for all EVM chains
                        address = evmAddress;
                        privateKey = evmPrivateKey;
                        break;

                    case 'ton':
                        // For TON, generate a random string that starts with EQ
                        const tonRandom = ethers.randomBytes(32);
                        const tonHex = ethers.hexlify(tonRandom);
                        address = `EQ${tonHex.slice(2, 48)}`;
                        privateKey = tonHex;
                        break;

                    case 'tron':
                        // For TRON, generate a random string that starts with T
                        const tronRandom = ethers.randomBytes(21);
                        const tronHex = ethers.hexlify(tronRandom);
                        address = `T${tronHex.slice(2, 35)}`;
                        privateKey = tronHex;
                        break;

                    case 'solana':
                        // For Solana, generate a proper base58 encoded address
                        const solRandom = ethers.randomBytes(32);
                        const solHex = ethers.hexlify(solRandom);
                        // Convert to base58 (using a simple base58 alphabet)
                        const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
                        let num = BigInt('0x' + solHex.slice(2));
                        let base58 = '';
                        while (num > 0) {
                            const mod = Number(num % 58n);
                            base58 = base58Chars[mod] + base58;
                            num = num / 58n;
                        }
                        // Ensure the address is between 32-44 characters
                        while (base58.length < 32) {
                            base58 = '1' + base58;
                        }
                        if (base58.length > 44) {
                            base58 = base58.slice(0, 44);
                        }
                        address = base58;
                        privateKey = solHex;
                        break;
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
                address: evmAddress, // Use the EVM address as the main address
                privateKey: evmPrivateKey, // Use the EVM private key as the main private key
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

            // Handle non-EVM chains differently
            if (['ton', 'tron', 'solana'].includes(network)) {
                // For non-EVM chains, we'll return the balance from the database
                const wallet = await Wallet.findOne({ 'networks.address': address });
                if (!wallet) {
                    console.log(`[getBalance] No wallet found for address ${address} on ${network}`);
                    return '0';
                }

                const networkData = wallet.networks.find(n => n.network === network);
                if (!networkData) {
                    console.log(`[getBalance] No network data found for ${network}`);
                    return '0';
                }

                // Ensure balance is properly formatted
                const balance = parseFloat(networkData.balance || '0');
                console.log(`[getBalance] Found balance in database for ${network}:`, balance);
                return balance.toFixed(6);
            }

            // For EVM chains (Ethereum, BSC, Polygon, Arbitrum)
            if (!this.providers[network]) {
                await this.initializeProviders();
                if (!this.providers[network]) {
                    throw new Error(`Provider still not initialized for network: ${network}`);
                }
            }

            const config = NETWORKS[network];
            if (!config || !config.usdtAddress) {
                console.warn(`[getBalance] Invalid network configuration or missing USDT address for ${network}`);
                return '0';
            }

            // Validate address format for EVM chains
            try {
                ethers.getAddress(address);
            } catch (error) {
                console.warn(`[getBalance] Invalid EVM address format for ${address}`);
                return '0';
            }

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

    async sendUSDT(userId, network, toAddress, amount, walletAddress) {
        console.log('[sendUSDT] Starting USDT transfer:', {
            userId,
            network,
            toAddress,
            amount,
            walletAddress
        });

        try {
            // Validate parameters
            if (!userId || !network || !toAddress || !amount || !walletAddress) {
                throw new Error('Please fill in all required fields');
            }

            // Validate address format based on network
            if (['ethereum', 'bsc', 'polygon', 'arbitrum'].includes(network)) {
                try {
                    ethers.getAddress(toAddress);
                } catch (error) {
                    throw new Error('Invalid Ethereum-style address format. Please check the recipient address.');
                }
            } else if (network === 'tron') {
                if (!toAddress.match(/^T[0-9A-Za-z]{25,33}$/)) {
                    throw new Error('Invalid TRON address format. TRON addresses should start with T and be 25-33 characters long.');
                }
            } else if (network === 'ton') {
                if (!toAddress.startsWith('EQ') && !toAddress.startsWith('UQ') ||
                    toAddress.length !== 48 ||
                    !/^[a-zA-Z0-9_-]{46}$/.test(toAddress.slice(2))) {
                    throw new Error('Invalid TON address format. TON addresses should start with EQ or UQ and be 48 characters long.');
                }
            } else if (network === 'solana') {
                if (!toAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
                    throw new Error('Invalid Solana address format. Solana addresses should be 32-44 characters long and contain only valid base58 characters.');
                }
            }

            // Validate and convert userId to ObjectId if it's a valid MongoDB ObjectId
            let senderUserId;
            try {
                senderUserId = new mongoose.Types.ObjectId(userId);
            } catch (error) {
                console.error('[sendUSDT] Invalid userId format:', error);
                throw new Error('Invalid user session. Please try logging in again.');
            }

            // Validate amount
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error('Please enter a valid amount greater than 0');
            }

            // Get sender's wallet
            const senderWallet = await Wallet.findOne({ userId: senderUserId });
            if (!senderWallet) {
                throw new Error('Your wallet was not found. Please try refreshing the page.');
            }

            // Check if wallet is frozen
            if (senderWallet.isFrozen) {
                throw new Error('Your wallet is currently frozen. Please contact support for assistance.');
            }

            // Calculate fee
            const fee = this.calculateTransactionFee(network);
            console.log('[sendUSDT] Calculated fee for', network + ':', fee);

            // Check if user has enough balance (including fee)
            const currentGlobalBalance = parseFloat(senderWallet.globalUsdtBalance || '0');
            const totalRequired = parsedAmount + fee;

            if (currentGlobalBalance < totalRequired) {
                throw new Error(`Insufficient balance. You need ${totalRequired.toFixed(2)} USDT (${parsedAmount.toFixed(2)} USDT + ${fee.toFixed(2)} USDT fee) but you have ${currentGlobalBalance.toFixed(2)} USDT`);
            }

            // Get or create recipient's wallet
            let recipientWallet = await Wallet.findOne({
                'networks.address': toAddress
            });

            if (!recipientWallet) {
                // Create a new wallet for the recipient without a userId
                const newWallet = {
                    networks: [{
                        network,
                        address: toAddress,
                        balance: parsedAmount.toFixed(6),
                        isActive: true
                    }],
                    balance: parsedAmount.toFixed(6),
                    isFrozen: false,
                    address: toAddress,
                    privateKey: ethers.randomBytes(32).toString('hex')
                };
                recipientWallet = await Wallet.create([newWallet]);
                recipientWallet = recipientWallet[0];
            } else {
                // Check if recipient wallet is frozen
                if (recipientWallet.isFrozen) {
                    throw new Error('The recipient wallet is frozen. Please contact support for assistance.');
                }

                // Update existing recipient wallet
                const networkIndex = recipientWallet.networks.findIndex(n => n.network === network);
                if (networkIndex === -1) {
                    recipientWallet.networks.push({
                        network,
                        address: toAddress,
                        balance: parsedAmount.toFixed(6),
                        isActive: true
                    });
                } else {
                    const currentBalance = parseFloat(recipientWallet.networks[networkIndex].balance || '0');
                    const newBalance = (currentBalance + parsedAmount).toFixed(6);
                    recipientWallet.networks[networkIndex].balance = newBalance;
                }
                const currentGlobalBalance = parseFloat(recipientWallet.globalUsdtBalance || '0');
                recipientWallet.globalUsdtBalance = (currentGlobalBalance + parsedAmount).toFixed(6);
                await recipientWallet.save();
            }

            // Create transaction records with retry logic
            let senderTx, recipientTx;
            let attempts = 0;
            const maxAttempts = 3;
            let session;

            while (attempts < maxAttempts) {
                try {
                    session = await mongoose.startSession();
                    session.startTransaction();

                    // Update sender's balances within the transaction
                    const currentGlobalBalance = parseFloat(senderWallet.globalUsdtBalance || '0');
                    const newGlobalBalance = parseFloat((currentGlobalBalance - parsedAmount - fee).toFixed(6));
                    senderWallet.globalUsdtBalance = newGlobalBalance;

                    // Update network-specific balance
                    const networkIndex = senderWallet.networks.findIndex(n => n.network === network);
                    if (networkIndex === -1) {
                        throw new Error('Network not found in your wallet. Please try refreshing the page.');
                    }
                    const currentNetworkBalance = parseFloat(senderWallet.networks[networkIndex].balance || '0');
                    const newNetworkBalance = parseFloat((currentNetworkBalance - parsedAmount - fee).toFixed(6));
                    senderWallet.networks[networkIndex].balance = newNetworkBalance;

                    await senderWallet.save({ session });

                    // Create both transactions atomically
                    const senderTransaction = new Transaction({
                        userId: senderUserId,
                        type: 'crypto',
                        subtype: 'send',
                        amount: -parsedAmount,
                        currency: 'USDT',
                        status: 'completed',
                        metadata: {
                            network,
                            fee,
                            fromAddress: walletAddress,
                            toAddress
                        }
                    });

                    const recipientTransaction = new Transaction({
                        type: 'crypto',
                        subtype: 'receive',
                        amount: parsedAmount,
                        currency: 'USDT',
                        status: 'completed',
                        metadata: {
                            network,
                            fee: 0,
                            fromAddress: walletAddress,
                            toAddress
                        }
                    });

                    // Generate references manually to ensure they're unique within the session
                    const timestamp = Date.now();
                    senderTransaction.reference = `TRX-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
                    recipientTransaction.reference = `TRX-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

                    // Save both transactions within the session
                    [senderTx, recipientTx] = await Promise.all([
                        senderTransaction.save({ session }),
                        recipientTransaction.save({ session })
                    ]);

                    await session.commitTransaction();
                    session.endSession();

                    // Emit balance updates
                    if (this.wsService) {
                        this.wsService.emitToUser(senderUserId.toString(), 'balance:updated', {
                            userId: senderUserId,
                            walletBalance: senderWallet.globalUsdtBalance
                        });

                        if (recipientWallet.userId) {
                            this.wsService.emitToUser(recipientWallet.userId.toString(), 'balance:updated', {
                                userId: recipientWallet.userId,
                                walletBalance: recipientWallet.globalUsdtBalance
                            });
                        }
                    }

                    return {
                        success: true,
                        transaction: senderTx,
                        message: 'USDT sent successfully'
                    };

                } catch (error) {
                    if (session) {
                        await session.abortTransaction();
                        session.endSession();
                    }

                    console.error(`[sendUSDT] Error on attempt ${attempts + 1}:`, error);

                    if (error.code === 11000 ||
                        (error.code === 251 && error.codeName === 'NoSuchTransaction') ||
                        error.hasOwnProperty('errorLabels') && error.errorLabels.includes('TransientTransactionError')) {
                        attempts++;
                        if (attempts < maxAttempts) {
                            console.log(`[sendUSDT] Retrying transaction (attempt ${attempts + 1}/${maxAttempts})`);
                            const backoff = Math.min(1000, Math.pow(2, attempts) * 100 + Math.random() * 100);
                            await new Promise(resolve => setTimeout(resolve, backoff));
                            continue;
                        }
                    }
                    throw error;
                }
            }

            throw new Error('Transaction failed after multiple attempts. Please try again later.');

        } catch (error) {
            console.error('[sendUSDT] Error:', error);
            // Return the specific error message instead of a generic one
            throw new Error(error.message || 'An unexpected error occurred. Please try again later.');
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