/**
 * Node Upload Status Model
 * @module nodeStatusModel
 * @description Domain model representing the upload status of a file to a specific node.
 * Maps to the 'node_upload_status' database table.
 */
class NodeUploadStatus {
  static tableName = 'node_upload_status';

  static Statuses = {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILURE: 'failure',
  };

  constructor(data) {
    this.id = data.id;
    this.fileUploadId = data.file_upload_id || data.fileUploadId;
    this.nodeId = data.node_id || data.nodeId;
    this.status = data.status || 'pending';
    this.errorMessage = data.error_message || data.errorMessage;
    this.completedAt = data.completed_at || data.completedAt;
  }

  /**
   * Validation for updating propagation status
   */
  static validateStatus(status) {
    const validStatuses = Object.values(this.Statuses);
    const errors = [];
    if (!validStatuses.includes(status)) {
      errors.push(`Invalid status: ${status}. Must be one of ${validStatuses.join(', ')}`);
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
    return new NodeUploadStatus({
      id: row.id,
      fileUploadId: row.file_upload_id,
      nodeId: row.node_id,
      status: row.status,
      errorMessage: row.error_message,
      completedAt: row.completed_at,
    });
  }
}

export default NodeUploadStatus;
