import './models/Wallet.js';
import walletService from './services/walletService.js';
import { ethers } from 'ethers';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function test() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Get the existing wallet from the database
        const Wallet = mongoose.model('Wallet');
        const existingWallet = await Wallet.findOne({});
        if (!existingWallet) {
            throw new Error('No wallet found in database');
        }
        const testAddress = existingWallet.address;
        const testPrivateKey = existingWallet.privateKey;
        console.log('Using existing wallet address:', testAddress);
        console.log('Using existing wallet private key:', testPrivateKey);
        console.log('Initial DB balance:', existingWallet.globalUsdtBalance);

        const recipientAddress = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
        const minterPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

        // Test Scenario 1: Send amount less than available balance
        console.log('\n=== Test Scenario 1: Send amount less than available balance ===');
        console.log('Step 1: Minting USDT on different networks...');
        await walletService.initializeProviders();

        // Mint on each network
        for (const network of ['ethereum', 'bsc', 'polygon']) {
            console.log(`\nMinting USDT on ${network}...`);
            const provider = walletService.providers[network];
            const signer = new ethers.Wallet(minterPrivateKey, provider);
            await walletService.mintTestUSDT(network, testAddress, signer);

            // Check DB balance after each mint
            const wallet = await Wallet.findOne({ address: testAddress });
            console.log(`DB balance after ${network} mint:`, wallet.globalUsdtBalance);
        }

        // Check recipient's initial balance
        let recipientWallet = await Wallet.findOne({ address: recipientAddress });
        console.log('\nRecipient initial balance:', recipientWallet ? recipientWallet.globalUsdtBalance : '0.000000');

        // Test Scenario 2: Send amount equal to available balance
        console.log('\n=== Test Scenario 2: Send amount equal to available balance ===');
        const wallet = await Wallet.findOne({ address: testAddress });
        const fullBalance = wallet.globalUsdtBalance;
        console.log('Attempting to send full balance:', fullBalance);

        try {
            const txHash = await walletService.sendUSDT(
                'polygon',
                testAddress,
                recipientAddress,
                fullBalance,
                testPrivateKey
            );
            console.log('Full balance transfer successful! Transaction hash:', txHash);

            // Check recipient's balance after transfer
            recipientWallet = await Wallet.findOne({ address: recipientAddress });
            console.log('Recipient balance after transfer:', recipientWallet.globalUsdtBalance);
            console.log('Recipient network balances:', recipientWallet.networks.map(n => `${n.network}: ${n.balance}`));
        } catch (error) {
            console.error('Full balance transfer failed:', error.message);
        }

        // Test Scenario 3: Send amount more than available balance
        console.log('\n=== Test Scenario 3: Send amount more than available balance ===');
        const tooMuchAmount = (parseFloat(fullBalance) * 2).toString();
        console.log('Attempting to send more than available:', tooMuchAmount);

        try {
            const txHash = await walletService.sendUSDT(
                'polygon',
                testAddress,
                recipientAddress,
                tooMuchAmount,
                testPrivateKey
            );
            console.log('Transfer successful! Transaction hash:', txHash);
        } catch (error) {
            console.error('Transfer failed as expected:', error.message);
        }

        // Test Scenario 4: Send from different networks
        console.log('\n=== Test Scenario 4: Send from different networks ===');
        for (const network of ['ethereum', 'bsc', 'polygon']) {
            console.log(`\nAttempting to send 100 USDT on ${network}...`);
            try {
                const txHash = await walletService.sendUSDT(
                    network,
                    testAddress,
                    recipientAddress,
                    '100',
                    testPrivateKey
                );
                console.log(`${network} transfer successful! Transaction hash:`, txHash);
            } catch (error) {
                console.error(`${network} transfer failed:`, error.message);
            }
        }

        // Final balance check
        console.log('\n=== Final Balance Check ===');
        const finalWallet = await Wallet.findOne({ address: testAddress });
        console.log('Final DB balance:', finalWallet.globalUsdtBalance);

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

test(); 