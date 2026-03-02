/**
 * Application Configuration
 * @module config
 * @description Centralized configuration management for the CMS service,
 * loading environment variables and defining system-wide constants.
 */
import 'dotenv/config';

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  apiKey: process.env.API_KEY,

  db: {
    client: 'pg',
    connectionString:
      process.env.DB_URI
  },
};

export default config;
