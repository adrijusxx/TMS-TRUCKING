import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/errors';

describe('AppError', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError('Test message', 'TEST_ERROR', 400, { key: 'value' });

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ key: 'value' });
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError('Test message', 'TEST_ERROR', 400, { key: 'value' });
      const json = error.toJSON();

      expect(json).toEqual({
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test message',
          details: { key: 'value' },
        },
      });
    });
  });

  describe('ValidationError', () => {
    it('should have correct status code', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('NotFoundError', () => {
    it('should create error with resource name', () => {
      const error = new NotFoundError('Load', 'load-123');
      expect(error.message).toContain('Load');
      expect(error.message).toContain('load-123');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('UnauthorizedError', () => {
    it('should have correct status code', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('ForbiddenError', () => {
    it('should have correct status code', () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });
});

























