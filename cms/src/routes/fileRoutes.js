/**
 * File Routes
 * @module fileRoutes
 * @description Defines API endpoints for file uploads, leveraging 
 * uploadMiddleware and authentication middleware.
 */
import { Router } from 'express';

import authMiddleware from '../middleware/authMiddleware.js';
import uploadMiddleware from '../middleware/uploadMiddleware.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

function createFileRoutes(fileController) {
  const router = Router();

  // Protected — upload + propagate (stricter rate limit)
  router.post('/upload', authMiddleware, uploadLimiter, uploadMiddleware.single('file'), fileController.upload);

  // Open — list all uploads with statuses
  router.get('/', authMiddleware, fileController.listAll);

  return router;
}

export default createFileRoutes;
