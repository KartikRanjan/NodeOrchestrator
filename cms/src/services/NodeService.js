/**
 * Node Service
 * @module NodeService
 * @description Business logic for node lifecycle management and registration.
 * Orchestrates node availability and health status tracking.
 *
 * Socket.IO is injected via setIo() after the server starts so that
 * REST-triggered lifecycle changes (e.g., POST /disconnect) can still
 * emit real-time events to the dashboard room.
 */
import logger from '../utils/logger.js';
import AppError from '../errors/AppError.js';

class NodeService {
  constructor(nodeRepository) {
    this.nodeRepository = nodeRepository;
    this._io = null; // Injected after server boot — see container.js bootstrapIo()
  }

  /**
   * Inject the Socket.IO server instance.
   * Called once from createApp() after io is created.
   * @param {import('socket.io').Server} io
   */
  setIo(io) {
    this._io = io;
  }

  /**
   * Register a new node or re-register an existing one.
   * Upsert ensures idempotent re-registration after node restarts.
   */
  async registerNode({ nodeId, ip, port }) {
    if (!nodeId || !ip || !port) {
      throw new AppError({
        message: 'nodeId, ip, and port are required',
        statusCode: 400,
        errorCode: 'VALIDATION_ERROR',
      });
    }

    logger.info('Registering node', { nodeId, ip, port });
    const node = await this.nodeRepository.upsert({ nodeId, ip, port });
    logger.info('Node registered successfully', { nodeId });
    return node;
  }

  /**
   * Mark a node as disconnected.
   * Idempotent — returns success even if the node is already disconnected.
   *
   * Emits `node:status-updated` to the dashboard room if io is available.
   * This covers REST-triggered disconnects (POST /api/nodes/disconnect).
   * Socket-triggered disconnects are handled directly in app.js.
   */
  async disconnectNode(nodeId, { emitEvent = true } = {}) {
    if (!nodeId) {
      throw new AppError({
        message: 'nodeId is required',
        statusCode: 400,
        errorCode: 'VALIDATION_ERROR',
      });
    }

    logger.info('Disconnecting node', { nodeId });
    const found = await this.nodeRepository.disconnect(nodeId);

    if (!found) {
      logger.warn('Disconnect requested for unknown node', { nodeId });
      throw new AppError({
        message: `Node '${nodeId}' not found`,
        statusCode: 404,
        errorCode: 'NODE_NOT_FOUND',
      });
    }

    // Emit to dashboard room only if triggered via REST (not from socket handler
    // which already manages its own emission to avoid double-emit).
    if (emitEvent && this._io) {
      this._io.to('dashboard').emit('node:status-updated', {
        nodeId,
        status: 'disconnected',
        timestamp: new Date().toISOString(),
      });
      logger.info('Emitted node:status-updated (disconnected) to dashboard', { nodeId });
    }

    return found;
  }

  /**
   * Update a node's lastSeen timestamp (used by heartbeat).
   * Returns { statusChanged: boolean } so the caller can decide
   * whether to emit a status update to the dashboard.
   */
  async updateLastSeen(nodeId) {
    if (!nodeId) return null;

    const node = await this.nodeRepository.findByNodeId(nodeId);
    if (!node) return null;

    const wasDisconnected = node.status === 'disconnected';

    // Update lastSeen and re-mark as connected if it went stale
    await this.nodeRepository.updateLastSeen(nodeId, wasDisconnected);

    return { statusChanged: wasDisconnected };
  }

  /**
   * Retrieve all registered nodes.
   */
  async getAllNodes() {
    return this.nodeRepository.findAll();
  }

  /**
   * Retrieve a single node by its logical ID.
   */
  async getNodeById(nodeId) {
    const node = await this.nodeRepository.findByNodeId(nodeId);
    if (!node) {
      throw new AppError({
        message: `Node '${nodeId}' not found`,
        statusCode: 404,
        errorCode: 'NODE_NOT_FOUND',
      });
    }
    return node;
  }

  /**
   * Retrieve all nodes currently in 'connected' status.
   */
  async getConnectedNodes() {
    return this.nodeRepository.findConnected();
  }
}

export default NodeService;
