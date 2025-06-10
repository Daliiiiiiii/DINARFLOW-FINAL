import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config = {
    solidity: "0.8.20",
    networks: {
        // Chain A (Ethereum)
        hardhatA: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
            accounts: {
                mnemonic: "test test test test test test test test test test test junk",
                path: "m/44'/60'/0'/0",
                initialIndex: 0,
                count: 20,
            },
        },
        // Chain B (BSC)
        hardhatB: {
            url: "http://127.0.0.1:8546",
            chainId: 31338,
            accounts: {
                mnemonic: "test test test test test test test test test test test junk",
                path: "m/44'/60'/0'/0",
                initialIndex: 0,
                count: 20,
            },
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
};

export default config; 