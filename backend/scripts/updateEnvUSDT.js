import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
const addressesPath = path.resolve(__dirname, '../usdtAddresses.json');

if (!fs.existsSync(addressesPath)) {
    console.error('usdtAddresses.json not found. Run the deployment script first.');
    process.exit(1);
}

const deployedAddresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));

const envKeyMap = {
    ethereum: 'HARDHAT_USDT_ADDRESS',
    bsc: 'BSC_USDT_ADDRESS',
    polygon: 'POLYGON_USDT_ADDRESS',
    arbitrum: 'ARBITRUM_USDT_ADDRESS',
    tron: 'TRON_USDT_ADDRESS',
    ton: 'TON_USDT_ADDRESS',
    solana: 'SOLANA_USDT_ADDRESS',
};

let envContent = '';
if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
}

const lines = envContent.split(/\r?\n/);
const updated = new Set();

const newLines = lines.map(line => {
    for (const [network, key] of Object.entries(envKeyMap)) {
        if (line.startsWith(key + '=')) {
            updated.add(key);
            return `${key}=${deployedAddresses[network] || ''}`;
        }
    }
    return line;
});

// Add any missing keys
for (const [network, key] of Object.entries(envKeyMap)) {
    if (!updated.has(key)) {
        newLines.push(`${key}=${deployedAddresses[network] || ''}`);
    }
}

const finalEnvContent = newLines.filter(Boolean).join('\n');

console.log('--- Content to be written to .env ---');
console.log(finalEnvContent);
console.log('--------------------------------------');

fs.writeFileSync(envPath, finalEnvContent);
console.log('.env file updated with new USDT addresses from usdtAddresses.json!');