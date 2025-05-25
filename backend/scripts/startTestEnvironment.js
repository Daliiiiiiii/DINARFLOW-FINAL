import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start Hardhat node
const hardhatNode = spawn('npx', ['hardhat', 'node'], {
    stdio: 'inherit',
    shell: true
});

// Wait for Hardhat node to start
setTimeout(async () => {
    try {
        // Run setup script using Hardhat
        const setup = spawn('npx', ['hardhat', 'run', 'scripts/setupTestEnvironment.js', '--network', 'localhost'], {
            stdio: 'inherit',
            shell: true,
            cwd: path.join(__dirname, '..')
        });

        setup.on('close', (code) => {
            if (code !== 0) {
                console.error('Setup script failed with code:', code);
                hardhatNode.kill();
                process.exit(1);
            }
            console.log('\nTest environment is ready!');
        });
    } catch (error) {
        console.error('Error running setup script:', error);
        hardhatNode.kill();
        process.exit(1);
    }
}, 5000); // Wait 5 seconds for Hardhat node to start

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nShutting down test environment...');
    hardhatNode.kill();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down test environment...');
    hardhatNode.kill();
    process.exit(0);
}); 