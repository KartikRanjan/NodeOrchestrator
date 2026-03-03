/**
 * Registration Service
 * @module registrationService
 * @description Handles node registration and disconnection logic with the central CMS.
 */
import axios from 'axios';
import config from '../config/index.js';

const registerWithCMS = async () => {
    try {
        const response = await axios.post(
            `${config.cmsUrl}/api/nodes/register`,
            {
                nodeId: config.nodeId,
                ip: config.nodeIp,
                port: config.port,
            },
            {
                headers: { 'x-api-key': config.apiKey },
            },
        );

        console.log(`[${config.nodeId}] Registered with CMS:`, response.data.message);
        return response.data;
    } catch (err) {
        const errorMsg = err.response
            ? `${err.response.status} — ${JSON.stringify(err.response.data)}`
            : err.message;
        console.error(`[${config.nodeId}] Failed to register with CMS: ${errorMsg}`);
        throw err;
    }
};

/**
 * Notify CMS that this node is disconnecting.
 *
 * Called during graceful shutdown.
 */
const disconnectFromCMS = async () => {
    try {
        await axios.post(
            `${config.cmsUrl}/api/nodes/disconnect`,
            { nodeId: config.nodeId },
            {
                headers: { 'x-api-key': config.apiKey },
            },
        );

        console.log(`[${config.nodeId}] Disconnected from CMS`);
    } catch (err) {
        console.error(`[${config.nodeId}] Failed to disconnect from CMS: ${err.message}`);
    }
};

export { registerWithCMS, disconnectFromCMS };
