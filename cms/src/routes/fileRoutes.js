/**
 * File Routes
 * @module fileRoutes
 * @description Defines API endpoints for file uploads, including Multer configuration
 * and authentication middleware integration.
 */
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import authMiddleware from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');

// Multer diskStorage — preserve original filename with timestamp prefix
// to avoid collisions when the same file is uploaded multiple times.
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${timestamp}${ext}`);
  },
});

const upload = multer({ storage });

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
  router.post('/upload', authMiddleware, upload.single('file'), fileController.upload);

  // Open — list all uploads with statuses
  router.get('/', fileController.listAll);

  return router;
}

export default createFileRoutes;
