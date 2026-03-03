#!/usr/bin/env node
/**
 * start-nodes.js
 *
 * Spawns N node-app instances using concurrently.
 */

const { execSync } = require('child_process');
const { createHash } = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');

const BASE_PORT = 4001;
const CMS_URL = 'http://localhost:3000';
const HOSTNAME = os.hostname();

// Read API_KEY from root .env
let apiKey = '';
try {
    const envPath = path.resolve(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/API_KEY=([^\s]+)/);
    if (match) apiKey = match[1];
} catch (err) {
    console.warn('Warning: Could not read API_KEY from root .env');
}

// Read count from CLI argument
const count = parseInt(process.argv[2], 10);

if (!count || count < 1) {
    console.error('Usage: npm run nodes <count>  (e.g. npm run nodes 3)');
    process.exit(1);
}

function stableNodeId(index) {
    return createHash('sha256')
        .update(`${HOSTNAME}:${index}`)
        .digest('hex')
        .slice(0, 12);
}

const names = [];
const colors = ['green', 'yellow', 'magenta', 'blue', 'white', 'grey'];
const commands = [];

for (let i = 1; i <= count; i++) {
    const port = BASE_PORT + (i - 1);
    const nodeId = stableNodeId(i);
    const color = colors[(i - 1) % colors.length];

    names.push(nodeId);
    // Run directly with node from root, passing all env vars including API_KEY
    // We avoid 'cd node-app' to reduce shell signal interference.
    commands.push(
        `API_KEY=${apiKey} NODE_ID=${nodeId} NODE_IP=127.0.0.1 PORT=${port} CMS_URL=${CMS_URL} node node-app/src/server.js`
    );

    console.log(`  [${nodeId}] → port ${port}`);
}

console.log(`\nStarting ${count} node worker(s)...\n`);

const concurrentlyArgs = [
    '--kill-others',          // Kill all children when concurrently stops
    '--kill-signal SIGINT',   // Send SIGINT so the app catches it for graceful shutdown
    '--handle-input',         // Forward signals correctly
    `-n ${names.join(',')}`,
    `-c ${names.map((_, i) => colors[i % colors.length]).join(',')}`,
    ...commands.map(cmd => `"${cmd}"`),
].join(' ');

try {
    execSync(`npx concurrently ${concurrentlyArgs}`, { stdio: 'inherit' });
} catch (e) {
    // Process usually exits with non-zero on Ctrl+C, but we want a clean finish
    process.exit(0);
}
