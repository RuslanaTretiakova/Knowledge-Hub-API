import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { CategoryService } from '../../category/category.service';

const mockPrisma = {
  category: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CategoryService(mockPrisma as any);
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue([
        { id: '1', name: 'Cat1', description: 'Desc1' },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Cat1');
    });
  });

  describe('findOne', () => {
    it('should return category by id', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: '1',
        name: 'Cat1',
        description: 'Desc1',
      });

      const result = await service.findOne('1');

      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.findOne('uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create category', async () => {
      mockPrisma.category.create.mockResolvedValue({
        id: '1',
        name: 'Cat1',
        description: 'Desc1',
      });

      const result = await service.create({
        name: 'Cat1',
        description: 'Desc1',
      });

      expect(result.name).toBe('Cat1');
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: '1',
        name: 'Cat1',
        description: 'Desc1',
      });
      mockPrisma.category.update.mockResolvedValue({
        id: '1',
        name: 'Updated',
        description: 'Updated',
      });

      const result = await service.update('1', {
        name: 'Updated',
        description: 'Updated',
      });

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('uuid', { name: 'Updated', description: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: '1',
        name: 'Cat1',
        description: 'Desc1',
      });
      mockPrisma.category.delete.mockResolvedValue({});

      await service.remove('1');

      expect(mockPrisma.category.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.remove('uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
