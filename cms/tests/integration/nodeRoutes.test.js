/**
 * Integration tests for POST /api/nodes/register and POST /api/nodes/disconnect.
 *
 * Strategy:
 *   - Build a minimal Express app using the real CMS route + middleware wiring
 *   - Stub NodeService so no DB connection is needed
 *   - Pass API key in every request (x-api-key header)
 */
import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { Router } from 'express';

import authMiddleware from '../../src/middleware/authMiddleware.js';
import errorHandler from '../../src/middleware/errorHandler.js';
import NodeController from '../../src/controllers/NodeController.js';
import AppError from '../../src/errors/AppError.js';

// ── Helpers ───────────────────────────────────────────────────────────────
function buildApp(nodeService) {
    const app = express();
    app.use(express.json());

    const controller = new NodeController(nodeService);
    const router = Router();

    router.post('/register', authMiddleware, controller.register);
    router.post('/disconnect', authMiddleware, controller.disconnect);
    router.get('/', authMiddleware, controller.listAll);
    router.get('/:nodeId', authMiddleware, controller.getNodeById);

    app.use('/api/nodes', router);
    app.use(errorHandler);
    return app;
}

const HEADERS = { 'x-api-key': 'test-key', 'Content-Type': 'application/json' };

// ── Tests ─────────────────────────────────────────────────────────────────
describe('Node Routes — Integration', () => {
    describe('POST /api/nodes/register', () => {
        it('returns 201 and the registered node on success', async () => {
            const node = { nodeId: 'n1', ip: '127.0.0.1', port: 4001, status: 'connected' };
            const nodeService = { registerNode: jest.fn().mockResolvedValue(node) };
            const app = buildApp(nodeService);

            const res = await request(app)
                .post('/api/nodes/register')
                .set(HEADERS)
                .send({ nodeId: 'n1', ip: '127.0.0.1', port: 4001 });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toMatchObject({ nodeId: 'n1', status: 'connected' });
        });

        it('returns 401 when API key is missing', async () => {
            const nodeService = { registerNode: jest.fn() };
            const app = buildApp(nodeService);

            const res = await request(app)
                .post('/api/nodes/register')
                .send({ nodeId: 'n1', ip: '127.0.0.1', port: 4001 });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('returns 400 when service throws a validation error', async () => {
            const nodeService = {
                registerNode: jest.fn().mockRejectedValue(
                    new AppError({ message: 'nodeId, ip, and port are required', statusCode: 400, errorCode: 'VALIDATION_ERROR' })
                ),
            };
            const app = buildApp(nodeService);

            const res = await request(app)
                .post('/api/nodes/register')
                .set(HEADERS)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('VALIDATION_ERROR');
        });
    });

    describe('POST /api/nodes/disconnect', () => {
        it('returns 200 when node is disconnected successfully', async () => {
            const nodeService = { disconnectNode: jest.fn().mockResolvedValue(true) };
            const app = buildApp(nodeService);

            const res = await request(app)
                .post('/api/nodes/disconnect')
                .set(HEADERS)
                .send({ nodeId: 'n1' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.nodeId).toBe('n1');
        });

        it('returns 404 when node is not found', async () => {
            const nodeService = {
                disconnectNode: jest.fn().mockRejectedValue(
                    new AppError({ message: "Node 'ghost' not found", statusCode: 404, errorCode: 'NODE_NOT_FOUND' })
                ),
            };
            const app = buildApp(nodeService);

            const res = await request(app)
                .post('/api/nodes/disconnect')
                .set(HEADERS)
                .send({ nodeId: 'ghost' });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('NODE_NOT_FOUND');
        });
    });

    describe('GET /api/nodes', () => {
        it('returns all nodes', async () => {
            const nodes = [{ nodeId: 'n1' }, { nodeId: 'n2' }];
            const nodeService = { getAllNodes: jest.fn().mockResolvedValue(nodes) };
            const app = buildApp(nodeService);

            const res = await request(app)
                .get('/api/nodes')
                .set(HEADERS);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
        });
    });

    describe('GET /api/nodes/:nodeId', () => {
        it('returns 200 and the node when found', async () => {
            const node = { nodeId: 'n1', ip: '127.0.0.1', port: 4001, status: 'connected' };
            const nodeService = { getNodeById: jest.fn().mockResolvedValue(node) };
            const app = buildApp(nodeService);

            const res = await request(app)
                .get('/api/nodes/n1')
                .set(HEADERS);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toMatchObject({ nodeId: 'n1', status: 'connected' });
        });

        it('returns 404 when node does not exist', async () => {
            const nodeService = {
                getNodeById: jest.fn().mockRejectedValue(
                    new AppError({ message: "Node 'ghost' not found", statusCode: 404, errorCode: 'NODE_NOT_FOUND' })
                ),
            };
            const app = buildApp(nodeService);

            const res = await request(app)
                .get('/api/nodes/ghost')
                .set(HEADERS);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('NODE_NOT_FOUND');
        });
    });
});
