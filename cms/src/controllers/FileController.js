/**
 * File Controller
 * @module FileController
 * @description HTTP controller for file-related operations, including upload orchestration
 * and status retrieval.
 */
import { success } from '../utils/response.js';
import AppError from '../errors/AppError.js';

class FileController {
  constructor(fileService) {
    this.fileService = fileService;
  }

  /**
   * POST /api/files/upload
   * Upload a file and propagate it to all connected nodes.
   */
  upload = async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError({
          message: 'No file provided',
          statusCode: 400,
          errorCode: 'FILE_REQUIRED',
        });
      }

      const { originalname: filename, path: filePath } = req.file;
      const result = await this.fileService.uploadAndPropagate({ filename, filePath });

      return success({
        res,
        data: result,
        message: 'File uploaded and propagation started successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/files
   * List all uploads with per-node propagation statuses.
   */
  listAll = async (req, res, next) => {
    try {
      const uploads = await this.fileService.getAllUploads();
      return success({
        res,
        data: uploads,
        message: 'Files retrieved successfully',
      });
    } catch (err) {
      next(err);
    }
  };
}

export default FileController;
