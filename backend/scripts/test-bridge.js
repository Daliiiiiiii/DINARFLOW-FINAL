import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bridgeService from '../services/bridgeService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testBridge() {
    // Load deployment info
    const deploymentInfo = JSON.parse(
        await fs.readFile(path.join(__dirname, '../deployment-info.json'), 'utf8')
    );

    // Initialize bridge service
    await bridgeService.initialize({
        depositA: deploymentInfo.chainA.deposit,
        usdtB: deploymentInfo.chainB.usdt
    });

    // Set up providers and wallets
    const providerA = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const providerB = new ethers.JsonRpcProvider('http://127.0.0.1:8546');

    // Create wallets
    const ownerWallet = new ethers.Wallet(
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        providerA
    );

    const userWallet = new ethers.Wallet(
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
        providerA
    );

    // Load contract artifacts
    const mockUsdtArtifact = JSON.parse(await fs.readFile(
        path.join(__dirname, '../artifacts/contracts/MockUSDT.sol/MockUSDT.json'),
        'utf8'
    ));

    const depositArtifact = JSON.parse(await fs.readFile(
        path.join(__dirname, '../artifacts/contracts/Deposit.sol/Deposit.json'),
        'utf8'
    ));

    // Initialize contracts with signers
    const mockUsdtA = new ethers.Contract(
        deploymentInfo.chainA.usdt,
        mockUsdtArtifact.abi,
        ownerWallet // Use owner wallet for minting
    );

    const depositContract = new ethers.Contract(
        deploymentInfo.chainA.deposit,
        depositArtifact.abi,
        userWallet // Use user wallet for deposits
    );

    // Mint USDT to user on Chain A
    console.log('Minting USDT to user on Chain A...');
    const mintTx = await mockUsdtA.mint(userWallet.address, ethers.parseUnits('100', 6));
    await mintTx.wait();
    console.log('Minted 100 USDT to user');

    // Approve Deposit contract to spend USDT
    console.log('Approving Deposit contract...');
    const approveTx = await mockUsdtA.connect(userWallet).approve(
        deploymentInfo.chainA.deposit,
        ethers.parseUnits('100', 6)
    );
    await approveTx.wait();
    console.log('Approved Deposit contract');

    // Deposit USDT
    console.log('Depositing USDT...');
    const depositTx = await depositContract.deposit(ethers.parseUnits('50', 6));
    await depositTx.wait();
    console.log('Deposited 50 USDT');

    // Wait for bridge service to process deposit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check user balance in bridge service
    const bridgeBalance = bridgeService.getUserBalance(userWallet.address);
    console.log('Bridge balance:', ethers.formatUnits(bridgeBalance, 6), 'USDT');

    // Request withdrawal
    console.log('Requesting withdrawal...');
    await bridgeService.processWithdrawal(
        userWallet.address,
        ethers.parseUnits('25', 6)
    );
    console.log('Withdrawal processed');

    // Check final bridge balance
    const finalBridgeBalance = bridgeService.getUserBalance(userWallet.address);
    console.log('Final bridge balance:', ethers.formatUnits(finalBridgeBalance, 6), 'USDT');
}

testBridge().catch(console.error); 