import { describe, expect, it } from 'vitest';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../common/errors/custom-errors';

describe('Custom errors', () => {
  it('uses default message for NotFoundError', () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
  });

  it('allows overriding ValidationError message', () => {
    const error = new ValidationError('invalid data');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('invalid data');
  });

  it('includes provided message for UnauthorizedError', () => {
    const error = new UnauthorizedError('no auth');
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('no auth');
  });

  it('sets status code for ForbiddenError', () => {
    const error = new ForbiddenError('blocked');
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('blocked');
  });
});
