/**
 * Upload Handler
 * @module uploadHandler
 * @description Request handler for processing incoming file uploads and
 * managing file storage on the node.
 */
import path from 'path';
import config from '../config/index.js';
import { emitUploadResult } from '../services/registrationService.js';
import { UPLOAD_COMPLETE, UPLOAD_FAILED } from '../constants/events.js';

const handleFileUpload = (req, res) => {
    try {
        const savedTo = path.join(config.receivedFilesDir, req.file.filename);

        console.log(`[${config.nodeId}] File received: ${req.file.originalname} → ${savedTo}`);

        // Notify CMS via socket for real-time dashboard updates
        emitUploadResult(UPLOAD_COMPLETE, {
            nodeId: config.nodeId,
            fileName: req.file.originalname,
            status: 'success',
        });

        res.status(200).json({
            status: 'success',
            nodeId: config.nodeId,
            filename: req.file.originalname,
            savedTo,
        });
    } catch (err) {
        emitUploadResult(UPLOAD_FAILED, {
            nodeId: config.nodeId,
            fileName: req.file?.originalname || 'unknown',
            status: 'failure',
            error: err.message,
        });

        res.status(500).json({ error: 'Internal server error' });
    }
};

export { handleFileUpload };
