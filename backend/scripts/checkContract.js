import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const provider = ethers.provider;

    console.log('Checking contract at address:', contractAddress);

    // Get contract code
    const code = await provider.getCode(contractAddress);
    console.log('Contract code:', code);

    if (code === '0x') {
        console.log('No contract found at this address');
        return;
    }

    // Try to get the contract instance
    const USDT = await ethers.getContractFactory('USDT');
    const usdt = USDT.attach(contractAddress);

    // Try to call some basic functions
    try {
        const name = await usdt.name();
        console.log('Contract name:', name);

        const symbol = await usdt.symbol();
        console.log('Contract symbol:', symbol);

        const decimals = await usdt.decimals();
        console.log('Contract decimals:', decimals);

        const totalSupply = await usdt.totalSupply();
        console.log('Total supply:', ethers.formatUnits(totalSupply, decimals));
    } catch (error) {
        console.error('Error calling contract functions:', error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 