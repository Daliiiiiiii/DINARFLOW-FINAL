require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.20",
    networks: {
        hardhat: {
            chainId: 31337,
            accounts: {
                accountsBalance: "10000000000000000000000" // 10000 ETH in wei
            }
        }
    },
    // Enable gas reporting
    gasReporter: {
        enabled: true,
        currency: 'USD',
        gasPrice: 21
    },
    // Enable contract verification
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY
    },
    // Enable mocha for testing
    mocha: {
        timeout: 40000
    }
}; 