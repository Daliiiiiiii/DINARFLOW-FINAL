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

            // Get sender's wallet
            const senderWallet = await Wallet.findOne({ address: fromAddress });
            if (!senderWallet) {
                console.log(`[sendUSDT] Sender wallet not found for address: ${fromAddress}`);
                throw new Error('Sender wallet not found');
            }

            // Calculate transaction fee based on network
            let feeAmount;
            if (network === 'ethereum') {
                feeAmount = '3.000000'; // 3 USDT for Ethereum
            } else {
                feeAmount = '1.000000'; // 1 USDT for all other networks
            }
            const totalAmount = (parseFloat(amount) + parseFloat(feeAmount)).toFixed(6);

            console.log(`[sendUSDT] Fee calculation:`, {
                network,
                amount,
                feeAmount,
                totalAmount,
                currentBalance: senderWallet.globalUsdtBalance
            });

            // Check if sender has enough balance including fee
            if (parseFloat(senderWallet.globalUsdtBalance) < parseFloat(totalAmount)) {
                console.log(`[sendUSDT] Insufficient balance:`, {
                    currentBalance: senderWallet.globalUsdtBalance,
                    requiredAmount: totalAmount
                });
                throw new Error('Insufficient global USDT balance (including transaction fee)');
            }

            // Update sender's network-specific balance
            const networkIndex = senderWallet.networks.findIndex(n => n.network === network);
            if (networkIndex !== -1) {
                const currentNetworkBalance = parseFloat(senderWallet.networks[networkIndex].balance || '0');
                const newNetworkBalance = (currentNetworkBalance - parseFloat(totalAmount)).toFixed(6);
                senderWallet.networks[networkIndex].balance = newNetworkBalance;
                console.log(`[sendUSDT] Updated sender's network balance for ${network} from ${currentNetworkBalance} to ${newNetworkBalance}`);
            }

            // Debit the amount and fee from sender's global balance
            const newGlobalBalance = (parseFloat(senderWallet.globalUsdtBalance) - parseFloat(totalAmount)).toFixed(6);
            senderWallet.globalUsdtBalance = newGlobalBalance;

            // Save the sender's wallet with updated balances
            await senderWallet.save();
            console.log(`[sendUSDT] Debited ${totalAmount} USDT (${amount} + ${feeAmount} fee) from user's global balance. New balance: ${newGlobalBalance}`);

            // Get backend hot wallet
            const backendPrivateKey = process.env.BACKEND_HOT_WALLET_PRIVATE_KEY;
            if (!backendPrivateKey) {
                console.log('[sendUSDT] Backend hot wallet private key not configured');
                throw new Error('Backend hot wallet private key not configured');
            }

            // Ensure providers are initialized
            if (!this.providers[network]) {
                console.log(`[sendUSDT] Initializing provider for network: ${network}`);
                await this.initializeProviders();
                if (!this.providers[network]) {
                    throw new Error(`Provider not initialized for network: ${network}`);
                }
            }

            const backendWallet = new ethers.Wallet(backendPrivateKey, this.providers[network]);
            console.log(`[sendUSDT] Using backend hot wallet address: ${backendWallet.address}`);

            // Get USDT contract
            const usdtContract = new ethers.Contract(
                NETWORKS[network].usdtAddress,
                USDT_ABI,
                backendWallet
            );

            // Check backend wallet's USDT balance
            const backendBalance = await usdtContract.balanceOf(backendWallet.address);
            const amountInUnits = ethers.parseUnits(amount.toString(), 6);

            console.log(`[sendUSDT] Backend wallet current balance: ${ethers.formatUnits(backendBalance, 6)} USDT`);
            console.log(`[sendUSDT] Required amount: ${ethers.formatUnits(amountInUnits, 6)} USDT`);

            // If backend wallet doesn't have enough USDT, mint some
            if (backendBalance < amountInUnits) {
                console.log(`[sendUSDT] Backend wallet needs more USDT, minting...`);

                // Check if the contract has the mint function
                const code = await this.providers[network].getCode(NETWORKS[network].usdtAddress);
                if (code === '0x') {
                    throw new Error(`No contract found at address ${NETWORKS[network].usdtAddress}`);
                }

                // Mint to backend wallet
                const mintTx = await usdtContract.mint(backendWallet.address, amountInUnits);
                console.log(`[sendUSDT] Mint transaction sent: ${mintTx.hash}`);
                await mintTx.wait();
                console.log(`[sendUSDT] Mint transaction mined`);

                // Verify the mint was successful
                const newBackendBalance = await usdtContract.balanceOf(backendWallet.address);
                console.log(`[sendUSDT] Backend wallet new balance: ${ethers.formatUnits(newBackendBalance, 6)} USDT`);
            }

            // Send USDT
            console.log(`[sendUSDT] Sending amount in units: ${amountInUnits}`);
            const tx = await usdtContract.transfer(toAddress, amountInUnits);
            console.log(`[sendUSDT] Transaction sent: ${tx.hash}`);

            // Wait for transaction to be mined
            const receipt = await tx.wait();
            console.log(`[sendUSDT] Transaction mined in block ${receipt.blockNumber}`);

            // Update recipient's balance if their wallet exists
            const recipientWallet = await Wallet.findOne({ address: toAddress });
            if (recipientWallet) {
                // Update network balance
                const networkIndex = recipientWallet.networks.findIndex(n => n.network === network);
                if (networkIndex === -1) {
                    recipientWallet.networks.push({
                        network,
                        address: toAddress,
                        balance: amount
                    });
                } else {
                    recipientWallet.networks[networkIndex].balance = (
                        parseFloat(recipientWallet.networks[networkIndex].balance || '0') +
                        parseFloat(amount)
                    ).toFixed(6);
                }

                // Update global balance
                recipientWallet.globalUsdtBalance = recipientWallet.networks.reduce((sum, n) => sum + parseFloat(n.balance || '0'), 0).toFixed(6);

                await recipientWallet.save();
                console.log(`[sendUSDT] Updated recipient's global balance to ${recipientWallet.globalUsdtBalance}`);
            }

            // Verify sender's balance after transaction
            const updatedSenderWallet = await Wallet.findOne({ address: fromAddress });
            console.log(`[sendUSDT] Verified sender's final balance: ${updatedSenderWallet.globalUsdtBalance}`);

            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                newBalance: newGlobalBalance,
                feeAmount: feeAmount
            };
        } catch (error) {
            console.error(`[sendUSDT] Error sending USDT on ${network}:`, error);

            // If transaction failed after debiting the balance, credit it back
            if (error.message.includes('transaction failed') || error.message.includes('insufficient funds')) {
                try {
                    const senderWallet = await Wallet.findOne({ address: fromAddress });
                    if (senderWallet) {
                        const totalAmount = (parseFloat(amount) + parseFloat(feeAmount)).toFixed(6);

                        // Credit back network balance
                        const networkIndex = senderWallet.networks.findIndex(n => n.network === network);
                        if (networkIndex !== -1) {
                            senderWallet.networks[networkIndex].balance = (
                                parseFloat(senderWallet.networks[networkIndex].balance || '0') +
                                parseFloat(totalAmount)
                            ).toFixed(6);
                        }

                        // Credit back global balance
                        senderWallet.globalUsdtBalance = (parseFloat(senderWallet.globalUsdtBalance) + parseFloat(totalAmount)).toFixed(6);
                        await senderWallet.save();
                        console.log(`[sendUSDT] Credited back ${totalAmount} USDT to user's balances after failed transaction`);
                    }
                } catch (rollbackError) {
                    console.error('[sendUSDT] Error rolling back balance:', rollbackError);
                }
            }

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

    async mintTestUSDT(network, address, signer = null) {
        try {
            console.log(`[mintTestUSDT] Starting mint for ${address} on ${network}`);

            // Ensure providers are initialized
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

            // Get backend hot wallet
            const backendPrivateKey = process.env.BACKEND_HOT_WALLET_PRIVATE_KEY;
            if (!backendPrivateKey) {
                throw new Error('Backend hot wallet private key not configured');
            }
            const backendWallet = new ethers.Wallet(backendPrivateKey, this.providers[network]);
            console.log(`[mintTestUSDT] Using backend hot wallet: ${backendWallet.address}`);

            // Create contract instance with backend wallet
            const contract = new ethers.Contract(
                networkConfig.usdtAddress,
                USDT_ABI,
                backendWallet
            );

            // Check backend wallet's USDT balance
            const backendBalance = await contract.balanceOf(backendWallet.address);
            const minRequiredBalance = ethers.parseUnits('1000', networkConfig.decimals);

            console.log(`[mintTestUSDT] Backend wallet current balance: ${ethers.formatUnits(backendBalance, networkConfig.decimals)} USDT`);

            // If backend wallet doesn't have enough USDT, mint some
            if (backendBalance < minRequiredBalance) {
                console.log(`[mintTestUSDT] Backend wallet needs more USDT, minting...`);

                // Check if the contract has the mint function
                const code = await this.providers[network].getCode(networkConfig.usdtAddress);
                if (code === '0x') {
                    throw new Error(`No contract found at address ${networkConfig.usdtAddress}`);
                }

                // Mint to backend wallet
                const mintTx = await contract.mint(backendWallet.address, minRequiredBalance);
                console.log(`[mintTestUSDT] Mint transaction sent: ${mintTx.hash}`);
                await mintTx.wait();
                console.log(`[mintTestUSDT] Mint transaction mined`);

                // Verify the mint was successful
                const newBackendBalance = await contract.balanceOf(backendWallet.address);
                console.log(`[mintTestUSDT] Backend wallet new balance: ${ethers.formatUnits(newBackendBalance, networkConfig.decimals)} USDT`);
            }

            // Now transfer to user's address
            console.log(`[mintTestUSDT] Transferring USDT to user address: ${address}`);
            const transferTx = await contract.transfer(address, minRequiredBalance);
            console.log(`[mintTestUSDT] Transfer transaction sent: ${transferTx.hash}`);
            const transferReceipt = await transferTx.wait();
            console.log(`[mintTestUSDT] Transfer transaction mined in block ${transferReceipt.blockNumber}`);

            // Verify the transfer was successful by checking balance
            const balance = await contract.balanceOf(address);
            const formattedBalance = ethers.formatUnits(balance, networkConfig.decimals);
            console.log(`[mintTestUSDT] Verified balance after transfer: ${formattedBalance} USDT`);

            // Update wallet balances in DB
            const wallet = await Wallet.findOne({ 'networks.address': address });
            if (wallet) {
                // Update the specific network balance
                const networkIndex = wallet.networks.findIndex(n => n.network === network);
                if (networkIndex !== -1) {
                    wallet.networks[networkIndex].balance = formattedBalance;
                }

                // Calculate global balance as sum of all network balances
                const globalBalance = wallet.networks.reduce((sum, network) => {
                    return sum + parseFloat(network.balance || '0');
                }, 0).toFixed(6);

                wallet.globalUsdtBalance = globalBalance;
                await wallet.save();
                console.log(`[mintTestUSDT] Updated wallet balances - Network: ${formattedBalance} USDT, Global: ${globalBalance} USDT`);
            }

            return {
                success: true,
                txHash: transferTx.hash,
                blockNumber: transferReceipt.blockNumber,
                balance: formattedBalance
            };
        } catch (error) {
            console.error(`[mintTestUSDT] Error:`, error);
            throw error;
        }
    }

    async mintInitialUSDT(req, res) { /* ... existing code ... */ }
}

export default new WalletService(); 