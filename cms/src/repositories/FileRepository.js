/**
 * File Repository
 * @module FileRepository
 * @description Data access layer for managing file upload records and node propagation status.
 * Encapsulates all database operations related to file lifecycle tracking.
 */
class FileRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Record a new file upload in the `file_uploads` table.
   * Returns the created record with its ID.
   */
  async createUploadRecord(filename) {
    const record = await this.prisma.fileUpload.create({
      data: { filename },
    });

    return { id: record.id, filename: record.filename };
  }

  /**
   * Insert a pending propagation record for a specific node.
   */
  async createNodeUploadStatus(fileUploadId, nodeId) {
    await this.prisma.nodeUploadStatus.create({
      data: {
        fileUploadId,
        nodeId,
        status: 'pending',
      },
    });
  }

  /**
   * Update the propagation status for a specific file + node combination.
   */
  async updateNodeUploadStatus(fileUploadId, nodeId, status, errorMessage = null) {
    await this.prisma.nodeUploadStatus.updateMany({
      where: { fileUploadId, nodeId },
      data: {
        status,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Retrieve all file uploads with their per-node propagation statuses.
   */
  async findAllWithStatus() {
    const uploads = await this.prisma.fileUpload.findMany({
      include: {
        nodeUploadStatuses: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return uploads.map((upload) => this._mapUpload(upload));
  }

  /**
   * Map the Prisma upload record to our application's data structure.
   */
  _mapUpload(upload) {
    return {
      id: upload.id,
      filename: upload.filename,
      uploadedAt: upload.uploadedAt,
      nodeStatuses: upload.nodeUploadStatuses.map((s) => ({
        fileUploadId: s.fileUploadId,
        nodeId: s.nodeId,
        status: s.status,
        errorMessage: s.errorMessage ?? undefined,
        completedAt: s.completedAt,
      })),
    };
  }
}

export default FileRepository;
