/**
 * Upload Middleware
 * @module uploadMiddleware
 * @description Configures Multer storage engine and instance for handling file uploads.
 * Preserves original filenames with timestamps to avoid collisions.
 */
import multer from 'multer';
import path from 'path';
import config from '../config/index.js';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.receivedFilesDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        cb(null, `${base}-${timestamp}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit (example)
    }
});

export default upload;
