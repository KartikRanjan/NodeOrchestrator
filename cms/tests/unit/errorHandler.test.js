import { describe, it, expect } from '@jest/globals';
import errorHandler from '../../src/middleware/errorHandler.js';
import AppError from '../../src/errors/AppError.js';

// ── Helpers ───────────────────────────────────────────────────────────────
function makeRes() {
    let _status;
    let _body;
    return {
        status(code) { _status = code; return this; },
        json(body) { _body = body; return this; },
        get status_() { return _status; },
        get body_() { return _body; },
    };
}

const req = { path: '/test', method: 'GET' };
const next = () => { };

// ── Tests ─────────────────────────────────────────────────────────────────
describe('errorHandler middleware', () => {
    it('uses statusCode and errorCode from AppError', () => {
        const err = new AppError({ message: 'Not found', statusCode: 404, errorCode: 'NODE_NOT_FOUND' });
        const res = makeRes();

        errorHandler(err, req, res, next);

        expect(res.status_).toBe(404);
        expect(res.body_.success).toBe(false);
        expect(res.body_.error).toBe('NODE_NOT_FOUND');
        expect(res.body_.message).toBe('Not found');
    });

    it('defaults to 500 / INTERNAL_ERROR for a plain Error', () => {
        const err = new Error('Something blew up');
        const res = makeRes();

        errorHandler(err, req, res, next);

        expect(res.status_).toBe(500);
        expect(res.body_.success).toBe(false);
        expect(res.body_.error).toBe('INTERNAL_ERROR');
        expect(res.body_.message).toBe('Something blew up');
    });

    it('response always includes a timestamp', () => {
        const err = new AppError({ message: 'Oops', statusCode: 400 });
        const res = makeRes();

        errorHandler(err, req, res, next);

        expect(res.body_.timestamp).toBeDefined();
    });
});
