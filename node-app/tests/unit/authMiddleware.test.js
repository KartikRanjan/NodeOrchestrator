/**
 * Unit tests for node-app authMiddleware.
 *
 * Tests the middleware directly by creating mock req/res/next objects —
 * no Express server needed.
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import authMiddleware from '../../src/middleware/authMiddleware.js';

// ── Helpers ───────────────────────────────────────────────────────────────
function makeRes() {
    const res = {
        _status: null,
        _body: null,
        status(code) { this._status = code; return this; },
        json(body) { this._body = body; return this; },
    };
    return res;
}

describe('authMiddleware (node-app)', () => {
    it('calls next() when the correct API key is provided', () => {
        const req = { headers: { 'x-api-key': 'test-key' } };
        const res = makeRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res._status).toBeNull(); // no response sent
    });

    it('returns 401 when API key is missing', () => {
        const req = { headers: {} };
        const res = makeRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res._status).toBe(401);
        expect(res._body.error).toBe('Unauthorized');
    });

    it('returns 401 when API key is wrong', () => {
        const req = { headers: { 'x-api-key': 'wrong-key' } };
        const res = makeRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res._status).toBe(401);
    });
});
