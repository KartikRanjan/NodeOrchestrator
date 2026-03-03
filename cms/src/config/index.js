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
    connectionString: process.env.DB_URI,
  },
  uploadsDir: path.resolve(__dirname, '..', '..', 'uploads'),
};

export default config;
