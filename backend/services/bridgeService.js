import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class BridgeService {
    constructor() {
        this.providerA = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        this.providerB = new ethers.JsonRpcProvider('http://127.0.0.1:8546');
        this.userBalances = new Map();
        this.treasuryWallet = null;
        this.depositContractA = null;
        this.usdtContractB = null;
    }

    async initialize(contractAddresses) {
        // Load contract artifacts
        const depositArtifact = JSON.parse(await fs.readFile(
            path.join(__dirname, '../artifacts/contracts/Deposit.sol/Deposit.json'),
            'utf8'
        ));

        const usdtArtifact = JSON.parse(await fs.readFile(
            path.join(__dirname, '../artifacts/contracts/MockUSDT.sol/MockUSDT.json'),
            'utf8'
        ));

        // Initialize contracts
        this.depositContractA = new ethers.Contract(
            contractAddresses.depositA,
            depositArtifact.abi,
            this.providerA
        );

        this.usdtContractB = new ethers.Contract(
            contractAddresses.usdtB,
            usdtArtifact.abi,
            this.providerB
        );

        // Set up treasury wallet (using the first account from the mnemonic)
        const wallet = ethers.Wallet.fromPhrase(
            "test test test test test test test test test test test junk",
            this.providerB
        );
        this.treasuryWallet = wallet.connect(this.providerB);

        // Start listening to deposit events
        this.startListening();
    }

    async startListening() {
        console.log('Starting to listen for deposit events...');

        this.depositContractA.on('Deposited', async (user, amount) => {
            console.log(`Deposit detected: ${user} deposited ${amount} USDT`);

            // Update user balance (convert BigInt to string for storage)
            const currentBalance = BigInt(this.userBalances.get(user) || '0');
            const newBalance = currentBalance + BigInt(amount);
            this.userBalances.set(user, newBalance.toString());

            console.log(`Updated balance for ${user}: ${ethers.formatUnits(newBalance, 6)} USDT`);
        });
    }

    async processWithdrawal(userAddress, amount) {
        // Convert stored balance to BigInt for comparison
        const balance = BigInt(this.userBalances.get(userAddress) || '0');
        const withdrawalAmount = BigInt(amount);

        if (balance < withdrawalAmount) {
            throw new Error('Insufficient balance for withdrawal');
        }

        try {
            // Send USDT from treasury to user on Chain B
            const tx = await this.usdtContractB
                .connect(this.treasuryWallet)
                .mint(userAddress, amount);

            await tx.wait();

            // Update user balance
            const newBalance = balance - withdrawalAmount;
            this.userBalances.set(userAddress, newBalance.toString());

            console.log(`Withdrawal processed: ${ethers.formatUnits(withdrawalAmount, 6)} USDT sent to ${userAddress} on Chain B`);
            return true;
        } catch (error) {
            console.error('Error processing withdrawal:', error);
            throw error;
        }
    }

    getUserBalance(userAddress) {
        // Return the stored balance as a BigInt
        return BigInt(this.userBalances.get(userAddress) || '0');
    }
}

export default new BridgeService(); 