/**
 * Integration tests for POST /api/files/upload and GET /api/files
 *
 * Strategy:
 *   - Build a minimal Express app with real route + auth middleware wiring
 *   - Stub FileService so no DB or real HTTP propagation occurs
 *   - Use supertest to submit a real multipart file upload
 */
import { describe, it, expect, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import authMiddleware from '../../src/middleware/authMiddleware.js';
import errorHandler from '../../src/middleware/errorHandler.js';
import uploadMiddleware from '../../src/middleware/uploadMiddleware.js';
import FileController from '../../src/controllers/FileController.js';
import AppError from '../../src/errors/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function buildApp(fileService) {
    const app = express();
    app.use(express.json());

    const controller = new FileController(fileService);
    const router = Router();

    router.post('/upload', authMiddleware, uploadMiddleware.single('file'), controller.upload);
    router.get('/', authMiddleware, controller.listAll);

    app.use('/api/files', router);
    app.use(errorHandler);
    return app;
}

const HEADERS = { 'x-api-key': 'test-key' };

// A tiny in-memory buffer to use as file content in tests
const TINY_FILE = Buffer.from('hello test');

describe('File Routes — Integration', () => {
    describe('POST /api/files/upload', () => {
        it('returns 200 and propagation results on success', async () => {
            const fileService = {
                uploadAndPropagate: jest.fn().mockResolvedValue({
                    fileId: 'file-1',
                    results: [
                        { nodeId: 'n1', status: 'success' },
                        { nodeId: 'n2', status: 'success' },
                    ],
                }),
            };
            const app = buildApp(fileService);

            const res = await request(app)
                .post('/api/files/upload')
                .set(HEADERS)
                .attach('file', TINY_FILE, 'test.txt');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.fileId).toBe('file-1');
            expect(res.body.data.results).toHaveLength(2);
        });

        it('returns 401 when API key is missing', async () => {
            const app = buildApp({ uploadAndPropagate: jest.fn() });

            const res = await request(app)
                .post('/api/files/upload')
                .attach('file', TINY_FILE, 'test.txt');

            expect(res.status).toBe(401);
        });

        it('returns 400 when no file is attached', async () => {
            const app = buildApp({ uploadAndPropagate: jest.fn() });

            const res = await request(app)
                .post('/api/files/upload')
                .set(HEADERS);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('returns 404 when no connected nodes exist', async () => {
            const fileService = {
                uploadAndPropagate: jest.fn().mockRejectedValue(
                    new AppError({ message: 'No connected nodes', statusCode: 404, errorCode: 'NO_CONNECTED_NODES' })
                ),
            };
            const app = buildApp(fileService);

            const res = await request(app)
                .post('/api/files/upload')
                .set(HEADERS)
                .attach('file', TINY_FILE, 'test.txt');

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('NO_CONNECTED_NODES');
        });
    });

    describe('GET /api/files', () => {
        it('returns all uploads with statuses', async () => {
            const uploads = [
                { id: 'file-1', filename: 'a.txt', nodeStatuses: [{ nodeId: 'n1', status: 'success' }] },
            ];
            const fileService = { getAllUploads: jest.fn().mockResolvedValue(uploads) };
            const app = buildApp(fileService);

            const res = await request(app)
                .get('/api/files')
                .set(HEADERS);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].nodeStatuses[0].status).toBe('success');
        });
    });
});
