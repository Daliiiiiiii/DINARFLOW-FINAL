import { ethers } from 'ethers';
import Web3 from 'web3';
import TronWeb from 'tronweb/dist/TronWeb.node.js';
import mongoose from 'mongoose';

// Network configurations
const NETWORKS = {
    ethereum: {
        name: 'Ethereum',
        rpc: process.env.ETH_RPC_URL,
        chainId: 5, // Goerli testnet
        usdtContract: '0x110a13FC3efE6A245B50102D2d529B792aC4c2B6', // Goerli testnet USDT
        decimals: 6
    },
    bsc: {
        name: 'BNB Chain',
        rpc: process.env.BSC_RPC_URL,
        chainId: 97, // BSC testnet
        usdtContract: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', // BSC testnet USDT
        decimals: 18
    },
    tron: {
        name: 'TRON',
        rpc: process.env.TRON_RPC_URL || 'https://api.nileex.io', // Default to Nile testnet
        chainId: 'nile', // Nile testnet
        usdtContract: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs', // Nile testnet USDT
        decimals: 6
    },
    polygon: {
        name: 'Polygon',
        rpc: process.env.POLYGON_RPC_URL,
        chainId: 80001, // Mumbai testnet
        usdtContract: '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832', // Mumbai testnet USDT
        decimals: 6
    },
    arbitrum: {
        name: 'Arbitrum',
        rpc: process.env.ARBITRUM_RPC_URL,
        chainId: 421613, // Goerli testnet
        usdtContract: '0x533046F316650C9B7C9F1E2Ec5B0Ef3CAF0F02D3', // Goerli testnet USDT
        decimals: 6
    }
};

// USDT ABI (minimal for transfers)
const USDT_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)'
];

class WalletService {
    constructor() {
        this.providers = {};
        this.initializeProviders();
    }

    initializeProviders() {
        // Initialize providers for each network
        Object.entries(NETWORKS).forEach(([network, config]) => {
            try {
                if (network === 'tron') {
                    // Initialize TronWeb with required parameters
                    const HttpProvider = TronWeb.providers.HttpProvider;
                    const fullNode = new HttpProvider(config.rpc);
                    const solidityNode = new HttpProvider(config.rpc);
                    const eventServer = new HttpProvider(config.rpc);

                    // Create TronWeb instance with proper configuration
                    const tronWeb = new TronWeb({
                        fullNode,
                        solidityNode,
                        eventServer,
                        headers: { "TRON-PRO-API-KEY": process.env.TRON_API_KEY || '' }
                    });

                    // Test the connection
                    tronWeb.trx.getNodeInfo().then(() => {
                        console.log(`Successfully connected to TRON network: ${config.rpc}`);
                        this.providers[network] = tronWeb;
                    }).catch(error => {
                        console.error(`Failed to connect to TRON network: ${error.message}`);
                        // Fallback to default Nile testnet
                        const fallbackTronWeb = new TronWeb({
                            fullHost: 'https://api.nileex.io'
                        });
                        this.providers[network] = fallbackTronWeb;
                    });
                } else {
                    this.providers[network] = new ethers.providers.JsonRpcProvider(config.rpc);
                }
            } catch (error) {
                console.error(`Error initializing provider for ${network}:`, error);
                // Initialize with a fallback provider if available
                if (network === 'tron') {
                    const fallbackTronWeb = new TronWeb({
                        fullHost: 'https://api.nileex.io'
                    });
                    this.providers[network] = fallbackTronWeb;
                } else {
                    this.providers[network] = new ethers.providers.JsonRpcProvider(
                        network === 'ethereum' ? 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' :
                            network === 'bsc' ? 'https://data-seed-prebsc-1-s1.binance.org:8545' :
                                network === 'polygon' ? 'https://rpc-mumbai.maticvigil.com' :
                                    'https://goerli-rollup.arbitrum.io/rpc'
                    );
                }
            }
        });
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

            // Generate a new wallet
            const wallet = ethers.Wallet.createRandom();

            // Create wallet document in database
            const Wallet = mongoose.model('Wallet');
            const walletDoc = await Wallet.create({
                userId,
                address: wallet.address,
                privateKey: wallet.privateKey, // Encrypt this in production!
                networks: Object.keys(NETWORKS).map(network => ({
                    network,
                    address: wallet.address,
                    balance: '0',
                    isActive: true
                })),
                isFrozen: false,
                createdAt: new Date()
            });

            return {
                address: wallet.address,
                networks: walletDoc.networks
            };
        } catch (error) {
            console.error('Error creating wallet:', error);
            if (error.message === 'Database not connected') {
                throw new Error('Database connection error. Please try again later.');
            }
            if (error.message === 'User not found') {
                throw new Error('User not found');
            }
            throw new Error('Failed to create wallet');
        }
    }

    async getBalance(network, address) {
        try {
            const config = NETWORKS[network];
            if (!config) throw new Error('Invalid network');

            const provider = this.providers[network];
            const contract = new ethers.Contract(config.usdtContract, USDT_ABI, provider);

            const balance = await contract.balanceOf(address);
            return ethers.utils.formatUnits(balance, config.decimals);
        } catch (error) {
            console.error('Error getting balance:', error);
            throw new Error('Failed to get balance');
        }
    }

    async sendUSDT(network, fromAddress, toAddress, amount, privateKey) {
        try {
            const config = NETWORKS[network];
            if (!config) throw new Error('Invalid network');

            const provider = this.providers[network];
            const wallet = new ethers.Wallet(privateKey, provider);
            const contract = new ethers.Contract(config.usdtContract, USDT_ABI, wallet);

            const amountWei = ethers.utils.parseUnits(amount.toString(), config.decimals);
            const tx = await contract.transfer(toAddress, amountWei);
            await tx.wait();

            return tx.hash;
        } catch (error) {
            console.error('Error sending USDT:', error);
            throw new Error('Failed to send USDT');
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
}

export default new WalletService(); 