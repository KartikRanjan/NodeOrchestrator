import pino from 'pino';

/**
 * Pino-based structured logger for the CMS service.
 */

const isProduction = process.env.NODE_ENV === 'production';

const pinoInstance = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: !isProduction ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    } : undefined,
});

const logger = {
    /**
     * Log at 'debug' level.
     * @param {string} message - Log message.
     * @param {Object} [meta] - Additional structured metadata.
     */
    debug(message, meta = {}) {
        pinoInstance.debug(meta, message);
    },

    /**
     * Log at 'info' level.
     * @param {string} message - Log message.
     * @param {Object} [meta] - Additional structured metadata.
     */
    info(message, meta = {}) {
        pinoInstance.info(meta, message);
    },

    /**
     * Log at 'warn' level.
     * @param {string} message - Log message.
     * @param {Object} [meta] - Additional structured metadata.
     */
    warn(message, meta = {}) {
        pinoInstance.warn(meta, message);
    },

    /**
     * Log at 'error' level.
     * @param {string} message - Log message.
     * @param {Object} [meta] - Additional structured metadata.
     */
    error(message, meta = {}) {
        pinoInstance.error(meta, message);
    },
};

export default logger;
