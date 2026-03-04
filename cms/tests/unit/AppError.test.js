import { describe, it, expect } from '@jest/globals';
import AppError from '../../src/errors/AppError.js';

describe('AppError', () => {
    it('sets message, statusCode, and errorCode from constructor', () => {
        const err = new AppError({ message: 'Not found', statusCode: 404, errorCode: 'NODE_NOT_FOUND' });

        expect(err.message).toBe('Not found');
        expect(err.statusCode).toBe(404);
        expect(err.errorCode).toBe('NODE_NOT_FOUND');
        expect(err.isOperational).toBe(true);
    });

    it('uses default statusCode (500) and errorCode when not provided', () => {
        const err = new AppError({ message: 'Oops' });

        expect(err.statusCode).toBe(500);
        expect(err.errorCode).toBe('INTERNAL_ERROR');
    });

    it('is an instance of Error', () => {
        const err = new AppError({ message: 'Test' });
        expect(err).toBeInstanceOf(Error);
    });

});
