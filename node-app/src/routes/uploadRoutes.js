/**
 * Upload Routes
 * @module uploadRoutes
 * @description Defines API endpoints for receiving file uploads from the CMS,
 * including Multer error handling and authentication.
 */
import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import config from '../config/index.js';
import { handleFileUpload } from '../handlers/uploadHandler.js';
import { emitUploadResult } from '../services/registrationService.js';
import { UPLOAD_FAILED } from '../constants/events.js';

const router = Router();


router.post('/upload', authMiddleware, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            emitUploadResult(UPLOAD_FAILED, {
                nodeId: config.nodeId,
                fileName: req.body?.filename || 'unknown',
                status: 'failure',
                error: err.message,
            });
            return res.status(400).json({ error: err.message });
        }
        handleFileUpload(req, res);
    });
});

export default router;
