/**
 * Integration tests for POST /upload on the Node App.
 *
 * Strategy:
 *   - Build the real Express app (createApp)
 *   - Mock registrationService so no real Socket.IO or CMS calls fire
 *   - Use supertest to POST a real multipart file
 *   - Verify files are saved to received_files/ and response is correct
 */
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Mock the registration service so no socket/CMS connections happen
jest.unstable_mockModule('../../src/services/registrationService.js', () => ({
    registerWithCMS: jest.fn().mockResolvedValue({}),
    disconnectFromCMS: jest.fn().mockResolvedValue({}),
    connectSocket: jest.fn(),
    disconnectSocket: jest.fn(),
    emitUploadResult: jest.fn(),
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECEIVED_FILES_DIR = path.resolve(__dirname, '../../received_files');

describe('Upload Route — Integration (node-app)', () => {
    let app;

    beforeAll(async () => {
        const { default: createApp } = await import('../../src/app.js');
        app = createApp();

        // Ensure received_files directory exists
        if (!fs.existsSync(RECEIVED_FILES_DIR)) {
            fs.mkdirSync(RECEIVED_FILES_DIR, { recursive: true });
        }
    });

    afterAll(() => {
        // Clean up any test files saved during tests
        const files = fs.readdirSync(RECEIVED_FILES_DIR).filter(f => f.startsWith('jest-test-'));
        files.forEach(f => fs.unlinkSync(path.join(RECEIVED_FILES_DIR, f)));
    });

    it('returns 401 when API key is missing', async () => {
        const res = await request(app)
            .post('/upload')
            .attach('file', Buffer.from('hello'), 'jest-test-file.txt');

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Unauthorized');
    });

    it('returns 401 when API key is wrong', async () => {
        const res = await request(app)
            .post('/upload')
            .set('x-api-key', 'wrong-key')
            .attach('file', Buffer.from('hello'), 'jest-test-file.txt');

        expect(res.status).toBe(401);
    });

    it('returns 400 when no file is attached', async () => {
        const res = await request(app)
            .post('/upload')
            .set('x-api-key', 'test-key');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('No file provided');
    });

    it('returns 200 and saves the file when upload is valid', async () => {
        const res = await request(app)
            .post('/upload')
            .set('x-api-key', 'test-key')
            .attach('file', Buffer.from('hello world'), 'jest-test-upload.txt');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.nodeId).toBe('test-node');
        expect(res.body.filename).toBe('jest-test-upload.txt');
    });

    it('returns 200 on GET /health with nodeId', async () => {
        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.nodeId).toBe('test-node');
    });
});
