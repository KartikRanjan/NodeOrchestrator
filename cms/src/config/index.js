/**
 * Application Configuration
 * @module config
 * @description Centralized configuration management for the CMS service,
 * loading environment variables and defining system-wide constants.
 */
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  apiKey: process.env.API_KEY,

  db: {
    client: 'pg',
    connectionString: process.env.DATABASE_URL,
  },
  uploadsDir: path.resolve(__dirname, '..', '..', 'uploads'),

  // Node health settings
  nodeHeartbeatThreshold: parseInt(process.env.NODE_HEARTBEAT_THRESHOLD, 10) || 60, // 60 seconds
  nodeCleanupInterval: parseInt(process.env.NODE_CLEANUP_INTERVAL, 10) || 30, // 30 seconds
};

export default config;
