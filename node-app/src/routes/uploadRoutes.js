/**
 * Upload Routes
 * @module uploadRoutes
 * @description Defines API endpoints for receiving file uploads from the CMS, 
 * including Multer configuration and authentication.
 */
import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { handleFileUpload } from '../handlers/uploadHandler.js';

const router = Router();

router.post('/upload', authMiddleware, upload.single('file'), handleFileUpload);

export default router;
