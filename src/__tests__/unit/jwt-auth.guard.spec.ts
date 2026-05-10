import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

const mockReflector = {
  getAllAndOverride: vi.fn(),
};

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new JwtAuthGuard(mockReflector as any);
  });

  it('should allow access to public routes', () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn(),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException for missing token', () => {
    expect(() => guard.handleRequest(null, null)).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException for error', () => {
    expect(() => guard.handleRequest(new Error('token error'), null)).toThrow(
      UnauthorizedException,
    );
  });

  it('should return user if valid', () => {
    const user = { userId: '1', login: 'user', role: 'viewer' };
    const result = guard.handleRequest(null, user);
    expect(result).toEqual(user);
  });
});
