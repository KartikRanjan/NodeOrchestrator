#!/usr/bin/env node
/**
 * start-nodes.js
 *
 * Spawns N node-app instances using concurrently.
 * Each instance gets a deterministic NODE_ID derived from:
 *   SHA-256(hostname + index) → first 12 hex chars
 *
 * Same machine + same index = same ID on every restart.
 * Mimics Docker's container ID format — stable, non-human-memorable.
 *
 * Usage:
 *   node scripts/start-nodes.js <count>
 *   npm run nodes 3
 */

const { execSync } = require('child_process');
const { createHash } = require('crypto');
const os = require('os');

const BASE_PORT = 4001;
const CMS_URL = 'http://localhost:3000';
const HOSTNAME = os.hostname();

// Read count from CLI argument
const count = parseInt(process.argv[2], 10);

if (!count || count < 1) {
    console.error('Usage: npm run nodes <count>  (e.g. npm run nodes 3)');
    process.exit(1);
}

/**
 * Generates a stable 12-character hex ID for a given slot index.
 * SHA-256(hostname + ':' + index) → first 12 hex chars.
 * Deterministic: same machine, same index → same ID every run.
 */
function stableNodeId(index) {
    return createHash('sha256')
        .update(`${HOSTNAME}:${index}`)
        .digest('hex')
        .slice(0, 12);
}

// Build per-instance label, colour, and command arrays
const names = [];
const colors = ['green', 'yellow', 'magenta', 'blue', 'white', 'grey'];
const commands = [];

for (let i = 1; i <= count; i++) {
    const port = BASE_PORT + (i - 1);
    const nodeId = stableNodeId(i);
    const color = colors[(i - 1) % colors.length];

    names.push(nodeId);
    commands.push(
        `NODE_ID=${nodeId} NODE_IP=127.0.0.1 PORT=${port} CMS_URL=${CMS_URL} npm run dev --prefix node-app`
    );

    console.log(`  [${nodeId}] → port ${port}`);
}

console.log(`\nStarting ${count} node worker(s)...\n`);

// Build and run the concurrently command
const concurrentlyArgs = [
    '--kill-others-on-fail',
    `-n ${names.join(',')}`,
    `-c ${names.map((_, i) => colors[i % colors.length]).join(',')}`,
    ...commands.map(cmd => `"${cmd}"`),
].join(' ');

try {
    execSync(`npx concurrently ${concurrentlyArgs}`, { stdio: 'inherit' });
} catch {
    process.exit(0);
}
