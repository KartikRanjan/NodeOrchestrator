import Node from '../models/NodeModel.js';

/**
 * Node Repository
 * @module NodeRepository
 * @description Data access layer for managing registered nodes in the orchestration network.
 * Provides CRUD operations for node registration and health tracking.
 */
class NodeRepository {
  constructor(knex) {
    this.knex = knex;
  }

  /**
   * Insert a new node or update it if node_id already exists.
   * Sets status to 'connected' and refreshes updated_at.
   */
  async upsert({ nodeId, ip, port }) {
    const existing = await this.knex('nodes').where({ node_id: nodeId }).first();

    if (existing) {
      await this.knex('nodes').where({ node_id: nodeId }).update({
        ip,
        port,
        status: 'connected',
        updated_at: new Date().toISOString(),
      });
      const updatedRow = await this.knex('nodes').where({ node_id: nodeId }).first();
      return Node.fromRow(updatedRow);
    }

    const [newRow] = await this.knex('nodes')
      .insert({
        node_id: nodeId,
        ip,
        port,
        status: 'connected',
      })
      .returning('*');

    return Node.fromRow(newRow);
  }

  /**
   * Mark a node as disconnected by its nodeId.
   */
  async disconnect(nodeId) {
    const updated = await this.knex('nodes').where({ node_id: nodeId }).update({
      status: 'disconnected',
      updated_at: new Date().toISOString(),
    });

    return updated > 0;
  }

  /**
   * Retrieve all registered nodes.
   */
  async findAll() {
    const rows = await this.knex('nodes')
      .select(
        'nodes.*',
        this.knex('node_upload_status')
          .max('completed_at')
          .whereRaw('node_upload_status.node_id = nodes.node_id')
          .as('last_file_upload_time')
      )
      .orderBy('registered_at', 'desc');
    return rows.map((row) => Node.fromRow(row));
  }

  /**
   * Retrieve a single node by its nodeId.
   */
  async findByNodeId(nodeId) {
    const row = await this.knex('nodes')
      .select(
        'nodes.*',
        this.knex('node_upload_status')
          .max('completed_at')
          .whereRaw('node_upload_status.node_id = nodes.node_id')
          .as('last_file_upload_time')
      )
      .where({ 'nodes.node_id': nodeId })
      .first();
    return Node.fromRow(row);
  }

  /**
   * Retrieve all nodes with status 'connected'.
   */
  async findConnected() {
    const rows = await this.knex('nodes').where({ status: 'connected' });
    return rows.map((row) => Node.fromRow(row));
  }

  /**
   * Refresh a node's updated_at timestamp (heartbeat).
   * If the node was previously disconnected, also restore status to 'connected'.
   *
   * @param {string} nodeId
   * @param {boolean} restoreConnected - true if node was disconnected and should be re-connected
   */
  async updateLastSeen(nodeId, restoreConnected = false) {
    const patch = { updated_at: new Date().toISOString() };
    if (restoreConnected) {
      patch.status = 'connected';
    }
    await this.knex('nodes').where({ node_id: nodeId }).update(patch);
  }

  /**
   * Find and mark nodes as 'disconnected' if they haven't sent a heartbeat
   * within the given threshold (in seconds).
   *
   * @param {number} thresholdSeconds - The maximum age of a heartbeat before a node is considered stale.
   * @returns {Promise<string[]>} - The IDs of the nodes that were marked as disconnected.
   */
  async cleanupStaleNodes(thresholdSeconds) {
    const thresholdDate = new Date(Date.now() - thresholdSeconds * 1000).toISOString();

    const staleNodes = await this.knex('nodes')
      .where('status', 'connected')
      .andWhere('updated_at', '<', thresholdDate)
      .select('node_id');

    const nodeIds = staleNodes.map((n) => n.node_id);

    if (nodeIds.length > 0) {
      await this.knex('nodes')
        .whereIn('node_id', nodeIds)
        .update({
          status: 'disconnected',
          updated_at: new Date().toISOString(),
        });
    }

    return nodeIds;
  }
}

export default NodeRepository;
