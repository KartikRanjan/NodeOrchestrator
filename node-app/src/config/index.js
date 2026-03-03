/**
 * Node App Configuration
 * @module config
 * @description Centralized configuration for the Node application, 
 * including node identity, port, and CMS connection details.
 */
import 'dotenv/config';
import path from 'path';

const config = {
    nodeId: process.env.NODE_ID || 'node-01',
    // NODE_IP: in Docker, set to $$HOSTNAME (container hostname) via docker-compose command override.
    // Falls back to '127.0.0.1' for local development.
    nodeIp: process.env.NODE_IP || '127.0.0.1',
    port: parseInt(process.env.PORT, 10) || 5001,
    cmsUrl: process.env.CMS_URL || 'http://localhost:3000',
    apiKey: process.env.API_KEY,
    receivedFilesDir: path.resolve(process.cwd(), 'received_files'),
};

export default config;
