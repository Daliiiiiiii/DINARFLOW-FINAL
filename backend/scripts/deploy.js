import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function deployContracts() {
    // Deploy on Chain A (Ethereum)
    const providerA = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const walletA = new ethers.Wallet(
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        providerA
    );

    // Deploy on Chain B (BSC)
    const providerB = new ethers.JsonRpcProvider('http://127.0.0.1:8546');
    const walletB = new ethers.Wallet(
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        providerB
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

    // Deploy MockUSDT on Chain A
    const mockUsdtFactoryA = new ethers.ContractFactory(
        mockUsdtArtifact.abi,
        mockUsdtArtifact.bytecode,
        walletA
    );
    const mockUsdtA = await mockUsdtFactoryA.deploy();
    await mockUsdtA.waitForDeployment();
    console.log('MockUSDT deployed on Chain A:', await mockUsdtA.getAddress());

    // Deploy Deposit contract on Chain A
    const depositFactoryA = new ethers.ContractFactory(
        depositArtifact.abi,
        depositArtifact.bytecode,
        walletA
    );
    const depositA = await depositFactoryA.deploy(await mockUsdtA.getAddress());
    await depositA.waitForDeployment();
    console.log('Deposit contract deployed on Chain A:', await depositA.getAddress());

    // Deploy MockUSDT on Chain B
    const mockUsdtFactoryB = new ethers.ContractFactory(
        mockUsdtArtifact.abi,
        mockUsdtArtifact.bytecode,
        walletB
    );
    const mockUsdtB = await mockUsdtFactoryB.deploy();
    await mockUsdtB.waitForDeployment();
    console.log('MockUSDT deployed on Chain B:', await mockUsdtB.getAddress());

    // Save deployment info
    const deploymentInfo = {
        chainA: {
            usdt: await mockUsdtA.getAddress(),
            deposit: await depositA.getAddress()
        },
        chainB: {
            usdt: await mockUsdtB.getAddress()
        }
    };

    await fs.writeFile(
        path.join(__dirname, '../deployment-info.json'),
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log('Deployment info saved to deployment-info.json');
}

deployContracts().catch(console.error); 