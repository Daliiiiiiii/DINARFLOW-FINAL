const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

// Minimal ERC20 ABI for balanceOf
const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)"
];

async function main() {
    const networksToDeploy = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'tron', 'ton', 'solana'];
    const deployedAddresses = {};

    for (const network of networksToDeploy) {
        console.log(`Deploying USDT contract to ${network}...`);
        const USDT = await hre.ethers.getContractFactory('USDT');
        const usdt = await USDT.deploy();
        await usdt.waitForDeployment();
        const address = await usdt.getAddress();
        deployedAddresses[network] = address;
        console.log(`USDT contract deployed to ${network} at ${address}`);

        // If deploying to the hardhat network, check the balance immediately
        if (network === 'ethereum') {
            console.log('Checking balance on Hardhat network immediately after deployment...');
            try {
                const provider = hre.ethers.provider; // Use Hardhat's default provider
                const usdtContract = new hre.ethers.Contract(
                    address,
                    ERC20_ABI,
                    provider
                );
                const balance = await usdtContract.balanceOf(address); // Check the contract's own balance (should be initial supply)
                console.log(`Contract's own USDT balance on Hardhat network: ${hre.ethers.formatUnits(balance, 6)} USDT`);

                // You might also want to check the balance of a test user here if you have their address handy
                // const testUserAddress = 'YOUR_TEST_USER_ADDRESS_HERE';
                // const userBalance = await usdtContract.balanceOf(testUserAddress);
                // console.log(`Test user's USDT balance on Hardhat network: ${hre.ethers.formatUnits(userBalance, 6)} USDT`);

            } catch (error) {
                console.error('Error checking balance after deployment:', error);
            }
        }
    }

    // Save addresses to JSON file
    const outputPath = path.resolve(__dirname, '../usdtAddresses.json');
    fs.writeFileSync(outputPath, JSON.stringify(deployedAddresses, null, 2));
    console.log('Deployed USDT contract addresses:', deployedAddresses);
    console.log('Saved deployed addresses to usdtAddresses.json');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 