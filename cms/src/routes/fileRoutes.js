/**
 * File Routes
 * @module fileRoutes
 * @description Defines API endpoints for file uploads, leveraging 
 * uploadMiddleware and authentication middleware.
 */
import { Router } from 'express';

import authMiddleware from '../middleware/authMiddleware.js';
import uploadMiddleware from '../middleware/uploadMiddleware.js';

/**
 * File routes — /api/files
 *
 * POST /upload is protected and expects multipart/form-data with a 'file' field.
 * GET / is open (consumed by the React frontend).
 *
 * @param {import('../controllers/FileController.js').default} fileController
 */
function createFileRoutes(fileController) {
  const router = Router();

  // Protected — upload + propagate
  router.post('/upload', authMiddleware, uploadMiddleware.single('file'), fileController.upload);

  // Open — list all uploads with statuses
  router.get('/', fileController.listAll);

  return router;
}

export default createFileRoutes;
