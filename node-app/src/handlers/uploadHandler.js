/**
 * Upload Handler
 * @module uploadHandler
 * @description Request handler for processing incoming file uploads and 
 * managing file storage on the node.
 */
import path from 'path';
import config from '../config/index.js';

const handleFileUpload = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
    }

    const savedTo = path.join(config.receivedFilesDir, req.file.filename);

    console.log(`[${config.nodeId}] File received: ${req.file.originalname} → ${savedTo}`);

    res.status(200).json({
        status: 'success',
        nodeId: config.nodeId,
        filename: req.file.originalname,
        savedTo,
    });
};

export { handleFileUpload };
