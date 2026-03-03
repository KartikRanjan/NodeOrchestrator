/**
 * Registration Service
 * @module registrationService
 * @description Handles node registration and disconnection logic with the central CMS.
 *
 * Two integration paths:
 *   1. HTTP REST  — registerWithCMS() / disconnectFromCMS() (unchanged, required for startup)
 *   2. Socket.IO  — connectSocket() opens a persistent socket to the CMS as type=node,
 *                   joins "nodes" and "node:<nodeId>" rooms, and emits lifecycle events.
 *
 * The CMS always treats DB as the source of truth — it writes to DB before emitting
 * to the dashboard room.
 */
import axios from 'axios';
import { io as socketIOClient } from 'socket.io-client';
import config from '../config/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Registration (startup + graceful shutdown)
// ─────────────────────────────────────────────────────────────────────────────

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

let _socket = null;

/**
 * Open a Socket.IO connection to the CMS as a node worker.
 *
 * The CMS connection handler (app.js) will:
 *   - Join the socket to "nodes" room (broadcast group)
 *   - Join the socket to "node:<nodeId>" room (private targeting)
 *
 * On connect:
 *   - Emits "node:connected" so CMS can update DB + notify dashboard
 *
 * On disconnect (socket drop):
 *   - CMS socket server detects drop and marks node as disconnected in DB
 *   - No explicit emit needed from the node side
 *
 * @returns {import('socket.io-client').Socket}
 */
const connectSocket = () => {
    if (_socket && _socket.connected) {
        return _socket;
    }

    _socket = socketIOClient(config.cmsUrl, {
        query: {
            type: 'node',
            nodeId: config.nodeId,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
    });

    _socket.on('connect', () => {
        console.log(`[${config.nodeId}] Socket connected to CMS (socketId: ${_socket.id})`);

        // Announce this node to the CMS — CMS updates DB + emits to dashboard
        _socket.emit('node:connected', {
            nodeId: config.nodeId,
            ip: config.nodeIp,
            port: config.port,
            timestamp: new Date().toISOString(),
        });
    });

    _socket.on('disconnect', (reason) => {
        console.log(`[${config.nodeId}] Socket disconnected from CMS (reason: ${reason})`);
        // CMS detects the drop via its own disconnect handler — no action needed here
    });

    _socket.on('connect_error', (err) => {
        console.warn(`[${config.nodeId}] Socket connection error: ${err.message}`);
    });

    // ── CMS → Node: targeted file upload event ──────────────────────────
    // The CMS emits this to "node:<nodeId>" or "nodes" room when a file
    // should be pulled or when the node should prepare to receive a push.
    // Actual file transfer continues to happen via HTTP POST /upload.
    _socket.on('file:upload', (fileMeta) => {
        console.log(`[${config.nodeId}] Received file:upload signal from CMS`, fileMeta);
        // The node prepares for the incoming HTTP POST
    });

    return _socket;
};

/**
 * Emit an upload result back to the CMS via the socket.
 * CMS handler will persist the result to DB first, then notify the dashboard.
 *
 * @param {'upload:complete'|'upload:failed'} event
 * @param {{ nodeId: string, fileName: string, status: string, error?: string }} payload
 */
const emitUploadResult = (event, payload) => {
    if (_socket && _socket.connected) {
        _socket.emit(event, {
            ...payload,
            timestamp: new Date().toISOString(),
        });
    }
};

/**
 * Cleanly close the socket connection.
 * Called during graceful shutdown after HTTP disconnect completes.
 */
const disconnectSocket = () => {
    if (_socket) {
        _socket.disconnect();
        _socket = null;
        console.log(`[${config.nodeId}] Socket disconnected`);
    }
};

export {
    registerWithCMS,
    disconnectFromCMS,
    connectSocket,
    emitUploadResult,
    disconnectSocket,
};
