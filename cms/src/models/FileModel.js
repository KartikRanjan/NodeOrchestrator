/**
 * File Upload Model
 * @module FileModel
 * @description Domain model representing a file upload record in the system.
 * Maps to the 'file_uploads' database table.
 */
class FileUpload {
  static tableName = 'file_uploads';

  constructor(data) {
    this.id = data.id;
    this.filename = data.filename;
    this.uploadedAt = data.uploaded_at || data.uploadedAt;
  }

  // ─────────────────────────────
  // Validation
  static validate({ filename }) {
    const errors = [];

    if (!filename || filename.trim() === '') {
      errors.push('filename is required');
    }

    if (filename && filename.length > 255) {
      errors.push('filename must not exceed 255 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Mapping helpers
  /**
   * Convert DB row → Model
   */
  static fromRow(row) {
    if (!row) return null;

    return new FileUpload({
      id: row.id,
      filename: row.filename,
      uploaded_at: row.uploaded_at,
    });
  }

  /**
   * Convert Model → DB row
   */
  toRow() {
    return {
      id: this.id,
      filename: this.filename,
      uploaded_at: this.uploadedAt,
    };
  }

  /**
   * Safe JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      filename: this.filename,
      uploadedAt: this.uploadedAt,
    };
  }
}

export default FileUpload;
