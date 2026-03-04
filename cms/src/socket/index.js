/**
 * Socket.IO Handler Registry
 * @module socket
 * @description Registers connection handlers for Dashboard and Node clients, 
 * managing room assignments and real-time status updates.
 */

import logger from '../utils/logger.js';
import config from '../config/index.js';
import {
    NODE_CONNECTED, NODE_HEARTBEAT, NODE_STATUS_UPDATED,
    UPLOAD_COMPLETE, UPLOAD_FAILED,
} from '../constants/events.js';

/**
 * Registers event listeners for Dashboard clients (UI updates only).
 * @param {import('socket.io').Socket} socket
 */
function registerDashboardHandlers(socket) {
    socket.join('dashboard');
    logger.info('Dashboard client connected', { socketId: socket.id });

    socket.on('disconnect', () => {
        logger.info('Dashboard client disconnected', { socketId: socket.id });
    });
}

/**
 * Registers event listeners for Node worker clients.
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 * @param {import('../container.js').default} container
 * @param {Map<string, string>} socketNodeMap - socketId → nodeId
 */
function registerNodeHandlers(socket, io, container, socketNodeMap) {
    const { nodeId } = socket.handshake.query;

    // Join rooms for broadcast and targeted events
    socket.join('nodes');
    socket.join(`node:${nodeId}`);
    socketNodeMap.set(socket.id, nodeId);

    logger.info('Node worker connected', { socketId: socket.id, nodeId });

    // Handle node registration and status sync
    socket.on(NODE_CONNECTED, async (payload) => {
        try {
            logger.info('node:connected', { nodeId: payload.nodeId });
            await container.nodeService.registerNode({
                nodeId: payload.nodeId,
                ip: payload.ip,
                port: payload.port,
            });
            io.to('dashboard').emit(NODE_STATUS_UPDATED, {
                nodeId: payload.nodeId,
                ip: payload.ip,
                port: payload.port,
                status: 'connected',
                timestamp: payload.timestamp,
            });
        } catch (err) {
            logger.error('Failed to handle node:connected', { nodeId: payload?.nodeId, error: err.message });
        }
    });

    // Update node health and notify dashboard on status changes
    socket.on(NODE_HEARTBEAT, async (payload) => {
        try {
            const updated = await container.nodeService.updateLastSeen(payload.nodeId);
            if (updated?.statusChanged) {
                io.to('dashboard').emit(NODE_STATUS_UPDATED, {
                    nodeId: payload.nodeId,
                    status: 'connected',
                    timestamp: payload.timestamp,
                });
            }
        } catch (err) {
            logger.error('Failed to handle node:heartbeat', { nodeId: payload?.nodeId, error: err.message });
        }
    });

    // Relay upload results to dashboard for real-time UI updates.
    // DB status is already persisted by the REST propagation flow in FileService._propagateToNode().
    socket.on(UPLOAD_COMPLETE, (payload) => {
        logger.info('upload:complete', { nodeId: payload.nodeId, fileName: payload.fileName });
        io.to('dashboard').emit(UPLOAD_COMPLETE, payload);
    });

    socket.on(UPLOAD_FAILED, (payload) => {
        logger.error('upload:failed', { nodeId: payload.nodeId, fileName: payload.fileName });
        io.to('dashboard').emit(UPLOAD_FAILED, payload);
    });

    // Handle abrupt node disconnection
    socket.on('disconnect', async () => {
        const disconnectedNodeId = socketNodeMap.get(socket.id);
        socketNodeMap.delete(socket.id);

        if (!disconnectedNodeId) {
            logger.warn('Disconnected socket had no node mapping', { socketId: socket.id });
            return;
        }

        logger.info('Node worker disconnected', { socketId: socket.id, nodeId: disconnectedNodeId });

        try {
            await container.nodeService.disconnectNode(disconnectedNodeId, { emitEvent: false });
            io.to('dashboard').emit(NODE_STATUS_UPDATED, {
                nodeId: disconnectedNodeId,
                status: 'disconnected',
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            logger.error('Failed to mark node disconnected', { nodeId: disconnectedNodeId, error: err.message });
        }
    });
}

/**
 * Attach all Socket.IO handlers based on client type.
 * @param {import('socket.io').Server} io
 * @param {import('../container.js').default} container
 */
function registerSocketHandlers(io, container) {
    const socketNodeMap = new Map(); // Tracks socketId to nodeId associations

    // Authenticate every socket connection via API key
    io.use((socket, next) => {
        const apiKey = socket.handshake.auth?.apiKey;
        if (!apiKey || apiKey !== config.apiKey) {
            logger.warn('Socket auth failed — invalid or missing API key', { socketId: socket.id });
            return next(new Error('Unauthorized — invalid or missing API key'));
        }
        next();
    });

    io.on('connection', (socket) => {
        const { type } = socket.handshake.query;

        if (type === 'dashboard') {
            registerDashboardHandlers(socket);
            return;
        }

        if (type === 'node' && socket.handshake.query.nodeId) {
            registerNodeHandlers(socket, io, container, socketNodeMap);
            return;
        }

        logger.warn('Unknown socket client type — disconnecting', { type, socketId: socket.id });
        socket.disconnect(true);
    });
}

export default registerSocketHandlers;
