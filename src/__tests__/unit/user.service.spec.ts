import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';
import * as bcrypt from 'bcryptjs';

const mockPrisma = {
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  comment: {
    deleteMany: vi.fn(),
  },
  article: {
    updateMany: vi.fn(),
  },
  $transaction: vi.fn(),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService(mockPrisma as any);
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: '1',
          login: 'user1',
          password: 'hash',
          role: 'VIEWER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.findAll();

      expect(result[0]).not.toHaveProperty('password');
      expect(result[0].role).toBe('viewer');
    });
  });

  describe('findOne', () => {
    it('should return user without password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        login: 'user1',
        password: 'hash',
        role: 'VIEWER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findOne('1');

      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create user with VIEWER role by default', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        login: 'user1',
        password: 'hash',
        role: 'VIEWER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({ login: 'user1', password: 'pass' });

      expect(result.role).toBe('viewer');
    });

    it('should throw BadRequestException for duplicate login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });

      await expect(
        service.create({ login: 'existing', password: 'pass' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should hash password before saving', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        login: 'user1',
        password: 'hash',
        role: 'VIEWER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.create({ login: 'user1', password: 'plaintext' });

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe('plaintext');
    });

    it('should not return password in response', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        login: 'user1',
        password: 'hash',
        role: 'VIEWER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({ login: 'user1', password: 'pass' });

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const hashedPassword = await bcrypt.hash('oldpass', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        login: 'user',
        password: hashedPassword,
        role: 'VIEWER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.user.update.mockResolvedValue({
        id: '1',
        login: 'user',
        password: 'newhash',
        role: 'VIEWER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updatePassword('1', {
        oldPassword: 'oldpass',
        newPassword: 'newpass',
      });

      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePassword('uuid', {
          oldPassword: 'old',
          newPassword: 'new',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for wrong old password', async () => {
      const hashedPassword = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        login: 'user',
        password: hashedPassword,
        role: 'VIEWER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.updatePassword('1', {
          oldPassword: 'wrong',
          newPassword: 'new',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        login: 'user',
        password: 'hash',
        role: 'VIEWER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.user.update.mockResolvedValue({
        id: '1',
        login: 'user',
        password: 'hash',
        role: 'EDITOR',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateRole('1', 'editor');

      expect(result.role).toBe('editor');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { role: 'EDITOR' },
        }),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.updateRole('uuid', 'editor')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete user with transaction', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        login: 'user',
        password: 'hash',
        role: 'VIEWER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.$transaction.mockResolvedValue([]);

      await service.remove('1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
