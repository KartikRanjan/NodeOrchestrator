/**
 * File Routes
 * @module fileRoutes
 * @description Defines API endpoints for file uploads, including Multer configuration
 * and authentication middleware integration.
 */
import path from 'path';
import { fileURLToPath } from 'url';

import { Router } from 'express';
import multer from 'multer';

import authMiddleware from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config — save uploaded files to cms/uploads/
const upload = multer({
  dest: path.resolve(__dirname, '..', '..', 'uploads'),
});

/**
 * File routes — /api/files
 *
 * Wires HTTP endpoints to FileController methods.
 * POST /upload is protected and expects multipart/form-data with a 'file' field.
 * GET / is open (consumed by the React frontend).
 */
function createFileRoutes(fileController) {
  const router = Router();

  // Protected — upload + propagate
  router.post('/upload', authMiddleware, upload.single('file'), fileController.upload);

  // Open — list all uploads with statuses
  router.get('/', fileController.listAll);

  return router;
}

export default createFileRoutes;
