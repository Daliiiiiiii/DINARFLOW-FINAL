import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addressesPath = path.resolve(__dirname, '../usdtAddresses.json');
const artifactPath = path.resolve(__dirname, '../artifacts/contracts/USDT.sol/USDT.json');

if (!fs.existsSync(addressesPath)) {
    console.error('usdtAddresses.json not found. Run the deployment script first.');
    process.exit(1);
}

if (!fs.existsSync(artifactPath)) {
    console.error('USDT contract artifact not found. Run hardhat compile first.');
    process.exit(1);
}

const deployedAddresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

const hardhatUsdtAddress = deployedAddresses.ethereum;

if (!hardhatUsdtAddress) {
    console.error('Hardhat USDT address not found in usdtAddresses.json');
    process.exit(1);
}

const USDT_ABI = contractArtifact.abi;

// Connect to Hardhat node
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

// Get the test user wallet address from the deployed addresses file
// Using the Hardhat deployed address for simplicity in testing balance check
const testUserAddress = deployedAddresses.ethereum;

console.log(`Attempting to check balance for address: ${testUserAddress} on contract ${hardhatUsdtAddress}`);

async function checkBalance() {
    try {
        const usdtContract = new ethers.Contract(
            hardhatUsdtAddress,
            USDT_ABI,
            provider
        );

        // Check if the contract code exists at the address
        const code = await provider.getCode(hardhatUsdtAddress);
        if (code === '0x') {
            console.error(`Error: No contract code found at address ${hardhatUsdtAddress}. Ensure Hardhat node is running and the contract was deployed.`);
            return;
        }

        const balance = await usdtContract.balanceOf(testUserAddress);

        console.log(`USDT balance for ${testUserAddress} on Hardhat network: ${ethers.formatUnits(balance, 6)} USDT`);
    } catch (error) {
        console.error('Error checking balance:', error);
    }
}

checkBalance(); 