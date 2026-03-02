/**
 * Node Model
 * @module NodeModel
 * @description Domain model representing a registered node in the orchestration network.
 * Maps to the 'nodes' database table.
 */
class Node {
  static tableName = 'nodes';

  constructor(data) {
    this.id = data.id;
    this.nodeId = data.nodeId;
    this.ip = data.ip;
    this.port = data.port;
    this.status = data.status || 'connected';
    this.registeredAt = data.registered_at || data.registeredAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  /**
   * Basic validation for node registration
   */
  static validate(data) {
    const errors = [];
    if (!data.nodeId) errors.push('nodeId is required');
    if (!data.ip) errors.push('ip is required');
    if (typeof data.port !== 'number' && isNaN(Number(data.port))) {
      errors.push('port must be a number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Map database row to Model instance
   */
  static fromRow(row) {
    if (!row) return null;
    return new Node({
      id: row.id,
      nodeId: row.node_id,
      ip: row.ip,
      port: row.port,
      status: row.status,
      registeredAt: row.registered_at,
      updatedAt: row.updated_at,
    });
  }
}

export default Node;
