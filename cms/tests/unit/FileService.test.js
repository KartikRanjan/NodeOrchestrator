import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Mock axios BEFORE importing FileService so module is replaced in its closure
jest.unstable_mockModule('axios', () => ({
    default: { post: jest.fn() },
}));

// Dynamic import AFTER mock is registered
const { default: FileService } = await import('../../src/services/FileService.js');
// Import the mocked axios once — same module instance FileService closes over
const { default: axios } = await import('axios');

// --- Mock repositories ---
const makeFileRepo = (overrides = {}) => ({
    createUploadRecord: jest.fn(),
    createNodeUploadStatus: jest.fn(),
    updateNodeUploadStatus: jest.fn(),
    findAllWithStatus: jest.fn(),
    ...overrides,
});

const makeNodeRepo = (overrides = {}) => ({
    findConnected: jest.fn(),
    ...overrides,
});

// --- Temp file shared across tests ---
const TMP_FILE = path.join(os.tmpdir(), 'jest-fileservice-test.txt');

beforeAll(() => {
    fs.writeFileSync(TMP_FILE, 'hello from jest test');
});

afterAll(() => {
    if (fs.existsSync(TMP_FILE)) fs.unlinkSync(TMP_FILE);
});

describe('FileService', () => {
    let service;
    let fileRepo;
    let nodeRepo;

    beforeEach(() => {
        jest.clearAllMocks();
        fileRepo = makeFileRepo();
        nodeRepo = makeNodeRepo();
        service = new FileService(fileRepo, nodeRepo);
    });

    // ── uploadAndPropagate ────────────────────────────────────────────────────
    describe('uploadAndPropagate', () => {
        it('throws validation error when filename is missing', async () => {
            await expect(service.uploadAndPropagate({ filename: '', filePath: TMP_FILE }))
                .rejects.toMatchObject({ statusCode: 400, errorCode: 'VALIDATION_ERROR' });
        });

        it('throws validation error when filePath is missing', async () => {
            await expect(service.uploadAndPropagate({ filename: 'test.txt', filePath: '' }))
                .rejects.toMatchObject({ statusCode: 400, errorCode: 'VALIDATION_ERROR' });
        });

        it('throws NO_CONNECTED_NODES when no nodes are connected', async () => {
            fileRepo.createUploadRecord.mockResolvedValue({ id: 'file-1', filename: 'test.txt' });
            nodeRepo.findConnected.mockResolvedValue([]);

            await expect(service.uploadAndPropagate({ filename: 'test.txt', filePath: TMP_FILE }))
                .rejects.toMatchObject({ statusCode: 404, errorCode: 'NO_CONNECTED_NODES' });
        });

        it('creates upload record and status records, returns results', async () => {
            axios.post.mockResolvedValue({ data: { status: 'success' } });

            fileRepo.createUploadRecord.mockResolvedValue({ id: 'file-1', filename: 'test.txt' });
            fileRepo.createNodeUploadStatus.mockResolvedValue();
            fileRepo.updateNodeUploadStatus.mockResolvedValue();
            nodeRepo.findConnected.mockResolvedValue([
                { nodeId: 'n1', ip: '127.0.0.1', port: 4001 },
                { nodeId: 'n2', ip: '127.0.0.1', port: 4002 },
            ]);

            const result = await service.uploadAndPropagate({ filename: 'test.txt', filePath: TMP_FILE });

            expect(fileRepo.createUploadRecord).toHaveBeenCalledWith('test.txt');
            expect(fileRepo.createNodeUploadStatus).toHaveBeenCalledWith('file-1', 'n1');
            expect(fileRepo.createNodeUploadStatus).toHaveBeenCalledWith('file-1', 'n2');
            expect(result.fileId).toBe('file-1');
            expect(result.results).toHaveLength(2);
        });

        it('records generic failure when propagation to a node fails', async () => {
            axios.post.mockRejectedValue(new Error('Connection refused'));

            fileRepo.createUploadRecord.mockResolvedValue({ id: 'file-2', filename: 'fail.txt' });
            fileRepo.createNodeUploadStatus.mockResolvedValue();
            fileRepo.updateNodeUploadStatus.mockResolvedValue();
            nodeRepo.findConnected.mockResolvedValue([
                { nodeId: 'n1', ip: '127.0.0.1', port: 4001 },
            ]);

            const result = await service.uploadAndPropagate({ filename: 'fail.txt', filePath: TMP_FILE });

            expect(result.results[0].status).toBe('failure');
            expect(fileRepo.updateNodeUploadStatus).toHaveBeenCalledWith('file-2', 'n1', 'failure', 'Connection refused');
        });

        it('records "API key rejected by node" when node returns 401', async () => {
            const authError = new Error('Request failed with status code 401');
            authError.response = { status: 401 };
            axios.post.mockRejectedValue(authError);

            fileRepo.createUploadRecord.mockResolvedValue({ id: 'file-3', filename: 'secret.txt' });
            fileRepo.createNodeUploadStatus.mockResolvedValue();
            fileRepo.updateNodeUploadStatus.mockResolvedValue();
            nodeRepo.findConnected.mockResolvedValue([
                { nodeId: 'n1', ip: '127.0.0.1', port: 4001 },
            ]);

            const result = await service.uploadAndPropagate({ filename: 'secret.txt', filePath: TMP_FILE });

            expect(result.results[0].status).toBe('failure');
            expect(fileRepo.updateNodeUploadStatus).toHaveBeenCalledWith(
                'file-3', 'n1', 'failure', 'API key rejected by node'
            );
        });
    });

    // ── getAllUploads ─────────────────────────────────────────────────────────
    describe('getAllUploads', () => {
        it('delegates to the repository', async () => {
            const uploads = [{ id: 'file-1', filename: 'a.txt', nodeStatuses: [] }];
            fileRepo.findAllWithStatus.mockResolvedValue(uploads);

            const result = await service.getAllUploads();
            expect(result).toEqual(uploads);
        });
    });
});
