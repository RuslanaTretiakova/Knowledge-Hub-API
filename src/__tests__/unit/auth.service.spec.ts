import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import * as bcrypt from 'bcryptjs';

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  revokedToken: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

const mockJwtService = {
  sign: vi.fn().mockReturnValue('mock-token'),
  verify: vi.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockJwtService.sign.mockReturnValue('mock-token');
    service = new AuthService(mockPrisma as any, mockJwtService as any);
  });

  describe('signup', () => {
    it('should create new user with ADMIN role if no admin exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'uuid-1',
        login: 'admin',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.signup({ login: 'admin', password: 'pass' });

      expect(result.role).toBe('admin');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'ADMIN' }),
        }),
      );
    });

    it('should create new user with VIEWER role if admin exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'admin-id' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'uuid-2',
        login: 'viewer',
        role: 'VIEWER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.signup({
        login: 'viewer',
        password: 'pass',
      });

      expect(result.role).toBe('viewer');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'VIEWER' }),
        }),
      );
    });

    it('should return existing user if login already taken', async () => {
      const existingUser = {
        id: 'uuid-1',
        login: 'admin',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      const result = await service.signup({ login: 'admin', password: 'pass' });

      expect(result.id).toBe('uuid-1');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should hash password before saving', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'uuid-1',
        login: 'user',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.signup({ login: 'user', password: 'plaintext' });

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe('plaintext');
    });

    it('should return id, login, role, createdAt, updatedAt', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      const now = new Date();
      mockPrisma.user.create.mockResolvedValue({
        id: 'uuid-1',
        login: 'user',
        role: 'ADMIN',
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.signup({ login: 'user', password: 'pass' });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('login');
      expect(result).toHaveProperty('role');
      expect(typeof result.createdAt).toBe('number');
      expect(typeof result.updatedAt).toBe('number');
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        login: 'user',
        password: hashedPassword,
        role: 'VIEWER',
      });

      const result = await service.login({
        login: 'user',
        password: 'password',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw ForbiddenException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        login: 'user',
        password: hashedPassword,
        role: 'VIEWER',
      });

      await expect(
        service.login({ login: 'user', password: 'wrong' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ login: 'nouser', password: 'pass' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('refresh', () => {
    it('should return new tokens for valid refresh token', async () => {
      mockPrisma.revokedToken.findUnique.mockResolvedValue(null);
      mockJwtService.verify.mockReturnValue({ userId: 'uuid-1' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        login: 'user',
        role: 'VIEWER',
      });

      const result = await service.refresh({ refreshToken: 'valid-token' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException if no refresh token', async () => {
      await expect(service.refresh({ refreshToken: '' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException if token is revoked', async () => {
      mockPrisma.revokedToken.findUnique.mockResolvedValue({ id: 'revoked' });

      await expect(
        service.refresh({ refreshToken: 'revoked-token' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for invalid token', async () => {
      mockPrisma.revokedToken.findUnique.mockResolvedValue(null);
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(
        service.refresh({ refreshToken: 'invalid' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user not found after verify', async () => {
      mockPrisma.revokedToken.findUnique.mockResolvedValue(null);
      mockJwtService.verify.mockReturnValue({ userId: 'uuid-1' });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'valid-token' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('logout', () => {
    it('should revoke token on logout', async () => {
      mockJwtService.verify.mockReturnValue({ userId: 'uuid-1' });
      mockPrisma.revokedToken.create.mockResolvedValue({});

      const result = await service.logout('valid-token');

      expect(result).toHaveProperty('message');
      expect(mockPrisma.revokedToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if no token', async () => {
      await expect(service.logout('')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException for invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.logout('invalid-token')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
