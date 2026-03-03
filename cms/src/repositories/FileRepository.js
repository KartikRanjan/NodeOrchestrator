/**
 * File Repository
 * @module FileRepository
 * @description Data access layer for managing file upload records and node propagation status.
 * Encapsulates all database operations related to file lifecycle tracking.
 */
class FileRepository {
  constructor(knex) {
    this.knex = knex;
  }

  /**
   * Record a new file upload in the `file_uploads` table.
   * Returns the created record with its ID.
   */
  async createUploadRecord(filename) {
    const [id] = await this.knex('file_uploads').insert({ filename }).returning('id');

    return { id: id?.id ?? id, filename };
  }

  /**
   * Insert a pending propagation record for a specific node.
   */
  async createNodeUploadStatus(fileUploadId, nodeId) {
    await this.knex('node_upload_status').insert({
      file_upload_id: fileUploadId,
      node_id: nodeId,
      status: 'pending',
    });
  }

  /**
   * Update the propagation status for a specific file + node combination.
   */
  async updateNodeUploadStatus(fileUploadId, nodeId, status, errorMessage = null) {
    await this.knex('node_upload_status')
      .where({ file_upload_id: fileUploadId, node_id: nodeId })
      .update({
        status,
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      });
  }

  /**
   * Update propagation status for a specific node + filename combination.
   * Used by socket event handlers (upload:complete / upload:failed) where
   * the node identifies the file by original filename, not fileUploadId.
   *
   * Resolves the file_upload_id by joining on filename first.
   */
  async updateNodeUploadStatusByFilename(nodeId, filename, status, errorMessage = null) {
    const uploadRecord = await this.knex('file_uploads')
      .where({ filename })
      .orderBy('uploaded_at', 'desc')
      .first();

    if (!uploadRecord) return; // File not tracked — no-op

    await this.knex('node_upload_status')
      .where({ file_upload_id: uploadRecord.id, node_id: nodeId })
      .update({
        status,
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      });
  }

  /**
   * Retrieve all file uploads with their per-node propagation statuses.
   */
  async findAllWithStatus() {
    const uploads = await this.knex('file_uploads').select('*').orderBy('uploaded_at', 'desc');

    const statuses = await this.knex('node_upload_status').select('*');

    // Group statuses by file_upload_id
    const statusMap = {};
    for (const s of statuses) {
      if (!statusMap[s.file_upload_id]) {
        statusMap[s.file_upload_id] = [];
      }
      statusMap[s.file_upload_id].push(s);
    }

    return uploads.map((upload) => ({
      ...upload,
      nodeStatuses: statusMap[upload.id] || [],
    }));
  }
}

export default FileRepository;
