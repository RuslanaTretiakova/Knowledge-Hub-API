import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../../auth/guards/roles.guard';

const mockReflector = {
  getAllAndOverride: vi.fn(),
};

const createMockContext = (user: any) =>
  ({
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn().mockReturnValue({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new RolesGuard(mockReflector as any);
  });

  it('should allow access if no roles required', () => {
    mockReflector.getAllAndOverride.mockReturnValue(null);

    const context = createMockContext({ role: 'viewer' });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow access for correct role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);

    const context = createMockContext({ role: 'ADMIN' });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException for insufficient role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);

    const context = createMockContext({ role: 'VIEWER' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException for editor trying admin route', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);

    const context = createMockContext({ role: 'EDITOR' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow editor for editor route', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['editor', 'admin']);

    const context = createMockContext({ role: 'EDITOR' });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });
});
