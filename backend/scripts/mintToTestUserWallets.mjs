import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import walletService from '../services/walletService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Reload environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supportedNetworks = [
    'ethereum',
    'bsc',
    'polygon',
    'arbitrum',
    'tron',
    'ton',
    'solana'
];

// Helper to add a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const Wallet = mongoose.model('Wallet', (await import('../models/Wallet.js')).default.schema);
        const testUserId = process.env.TEST_USER_ID;
        if (!testUserId) {
            console.error('TEST_USER_ID not set in .env');
            process.exit(1);
        }

        const wallet = await Wallet.findOne({ userId: testUserId });
        if (!wallet) {
            console.error('Test user wallet not found');
            process.exit(1);
        }

        // Reinitialize providers with new addresses
        // This ensures walletService uses the addresses from the updated .env
        await walletService.initializeProviders();

        console.log('Attempting to mint and verify balances...');

        for (const net of wallet.networks) {
            try {
                console.log(`Minting 50 USDT for ${net.address} on ${net.network}...`);
                await walletService.mintTestUSDT(net.network, net.address);
                console.log(`Mint transaction sent for ${net.network} to ${net.address}.`);

                // Add a short delay
                await delay(2000); // 2 second delay
                console.log(`Delayed for 2 seconds. Checking balance...`);

                // Check balance immediately after minting and delay
                const updatedBalance = await walletService.getBalance(net.network, net.address);
                console.log(`Verified balance for ${net.address} on ${net.network}: ${updatedBalance} USDT`);

            } catch (err) {
                console.error(`Failed during mint or balance check for ${net.network}:`, err.message);
            }
        }
    } catch (err) {
        console.error('Error in minting script:', err);
    } finally {
        await mongoose.disconnect();
    }
}

main(); 