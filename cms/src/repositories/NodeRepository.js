/**
 * Node Repository
 * @module NodeRepository
 * @description Data access layer for managing registered nodes in the orchestration network.
 * Provides CRUD operations for node registration and health tracking.
 */
class NodeRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Insert a new node or update it if node_id already exists.
   * Sets status to 'connected' and refreshes updated_at.
   */
  async upsert({ nodeId, ip, port }) {
    const node = await this.prisma.node.upsert({
      where: { nodeId },
      update: {
        ip,
        port,
        status: 'connected',
        updatedAt: new Date(),
      },
      create: {
        nodeId,
        ip,
        port,
        status: 'connected',
      },
    });

    return this._mapNode(node);
  }

  /**
   * Mark a node as disconnected by its nodeId.
   */
  async disconnect(nodeId) {
    try {
      await this.prisma.node.update({
        where: { nodeId },
        data: {
          status: 'disconnected',
          updatedAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Retrieve all registered nodes.
   */
  async findAll() {
    const nodes = await this.prisma.node.findMany({
      include: {
        nodeUploadStatuses: {
          where: {
            status: 'success',
            completedAt: { not: null },
          },
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { registeredAt: 'desc' },
    });

    return nodes.map((n) => this._mapNode(n));
  }

  /**
   * Retrieve a single node by its nodeId.
   */
  async findByNodeId(nodeId) {
    const node = await this.prisma.node.findUnique({
      where: { nodeId },
      include: {
        nodeUploadStatuses: {
          where: {
            status: 'success',
            completedAt: { not: null },
          },
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
    });

    return this._mapNode(node);
  }

  /**
   * Retrieve all nodes with status 'connected'.
   */
  async findConnected() {
    return await this.prisma.node.findMany({
      where: { status: 'connected' },
      select: {
        nodeId: true,
        ip: true,
        port: true,
        status: true,
      },
    });
  }

  /**
   * Refresh a node's updated_at timestamp (heartbeat).
   * If the node was previously disconnected, also restore status to 'connected'.
   *
   * @param {string} nodeId
   * @param {boolean} restoreConnected - true if node was disconnected and should be re-connected
   */
  async updateLastSeen(nodeId, restoreConnected = false) {
    const data = { updatedAt: new Date() };
    if (restoreConnected) {
      data.status = 'connected';
    }

    try {
      await this.prisma.node.update({
        where: { nodeId },
        data,
      });
    } catch (error) {
      // Ignore if node doesn't exist
    }
  }

  /**
   * Find and mark nodes as 'disconnected' if they haven't sent a heartbeat
   * within the given threshold (in seconds).
   *
   * @param {number} thresholdSeconds - The maximum age of a heartbeat before a node is considered stale.
   * @returns {Promise<string[]>} - The IDs of the nodes that were marked as disconnected.
   */
  async cleanupStaleNodes(thresholdSeconds) {
    const thresholdDate = new Date(Date.now() - thresholdSeconds * 1000);

    const staleNodes = await this.prisma.node.findMany({
      where: {
        status: 'connected',
        updatedAt: { lt: thresholdDate },
      },
      select: { nodeId: true },
    });

    const nodeIds = staleNodes.map((n) => n.nodeId);

    if (nodeIds.length > 0) {
      await this.prisma.node.updateMany({
        where: { nodeId: { in: nodeIds } },
        data: {
          status: 'disconnected',
          updatedAt: new Date(),
        },
      });
    }

    return nodeIds;
  }

  /**
   * Map the Prisma node record to our application's data structure.
   * @private
   */
  _mapNode(node) {
    if (!node) return null;

    return {
      nodeId: node.nodeId,
      ip: node.ip,
      port: node.port,
      status: node.status,
      registeredAt: node.registeredAt,
      updatedAt: node.updatedAt,
      lastFileUploadTime: node.nodeUploadStatuses?.[0]?.completedAt || undefined,
    };
  }
}

export default NodeRepository;

