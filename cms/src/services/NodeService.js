/**
 * Node Service
 * @module NodeService
 * @description Business logic for node lifecycle management and registration.
 * Orchestrates node availability and health status tracking.
 */
import logger from '../utils/logger.js';
import AppError from '../errors/AppError.js';

class NodeService {
  constructor(nodeRepository) {
    this.nodeRepository = nodeRepository;
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
   */
  async disconnectNode(nodeId) {
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

    return found;
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
