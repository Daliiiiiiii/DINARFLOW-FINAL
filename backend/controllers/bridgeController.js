import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bridgeService from '../services/bridgeService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize bridge service with contract addresses
async function initializeBridge() {
    const deploymentInfo = JSON.parse(
        await fs.readFile(path.join(__dirname, '../deployment-info.json'), 'utf8')
    );

    await bridgeService.initialize({
        depositA: deploymentInfo.chainA.deposit,
        usdtB: deploymentInfo.chainB.usdt
    });
}

// Initialize bridge on server start
initializeBridge().catch(console.error);

export const getBridgeBalance = async (req, res) => {
    try {
        const { address } = req.params;
        const balance = bridgeService.getUserBalance(address);
        res.json({ balance: ethers.formatUnits(balance, 6) });
    } catch (error) {
        console.error('Error getting bridge balance:', error);
        res.status(500).json({ error: 'Failed to get bridge balance' });
    }
};

export const processBridge = async (req, res) => {
    try {
        const { fromNetwork, amount, userAddress } = req.body;

        if (!fromNetwork || !amount || !userAddress) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Convert amount to proper format (6 decimals for USDT)
        const amountInWei = ethers.parseUnits(amount.toString(), 6);

        // Process the bridge request
        await bridgeService.processWithdrawal(userAddress, amountInWei);

        res.json({
            success: true,
            message: 'Bridge request processed successfully',
            newBalance: ethers.formatUnits(bridgeService.getUserBalance(userAddress), 6)
        });
    } catch (error) {
        console.error('Error processing bridge request:', error);
        res.status(500).json({
            error: error.message || 'Failed to process bridge request'
        });
    }
};

export const getBridgeStatus = async (req, res) => {
    try {
        const { address } = req.params;
        const balance = bridgeService.getUserBalance(address);

        res.json({
            balance: ethers.formatUnits(balance, 6),
            isActive: true // You can add more status information here
        });
    } catch (error) {
        console.error('Error getting bridge status:', error);
        res.status(500).json({ error: 'Failed to get bridge status' });
    }
}; 