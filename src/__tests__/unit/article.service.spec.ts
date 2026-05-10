import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ArticleService } from '../../article/article.service';

const mockPrisma = {
  article: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
};

describe('ArticleService', () => {
  let service: ArticleService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ArticleService(mockPrisma as any);
  });

  describe('findAll', () => {
    it('should return all articles', async () => {
      mockPrisma.article.findMany.mockResolvedValue([
        {
          id: '1',
          title: 'Test',
          content: 'Content',
          status: 'DRAFT',
          tags: [],
          authorId: null,
          categoryId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.findAll({});

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('draft');
    });

    it('should filter by status', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);

      await service.findAll({ status: 'draft' as any });

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'DRAFT' }),
        }),
      );
    });

    it('should filter by categoryId', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);

      await service.findAll({ categoryId: 'cat-1' });

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat-1' }),
        }),
      );
    });

    it('should filter by tag', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);

      await service.findAll({ tag: 'nodejs' });

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: expect.objectContaining({
              some: { name: 'nodejs' },
            }),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return article by id', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({
        id: '1',
        title: 'Test',
        content: 'Content',
        status: 'DRAFT',
        tags: [],
        authorId: null,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findOne('1');

      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if article not found', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      await expect(service.findOne('uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create article with draft status by default', async () => {
      mockPrisma.article.create.mockResolvedValue({
        id: '1',
        title: 'Test',
        content: 'Content',
        status: 'DRAFT',
        tags: [],
        authorId: null,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({
        title: 'Test',
        content: 'Content',
        status: 'draft' as any,
        tags: [],
      });

      expect(result.status).toBe('draft');
    });

    it('should create article with tags using connectOrCreate', async () => {
      mockPrisma.article.create.mockResolvedValue({
        id: '1',
        title: 'Test',
        content: 'Content',
        status: 'DRAFT',
        tags: [{ name: 'nodejs' }],
        authorId: null,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.create({
        title: 'Test',
        content: 'Content',
        status: 'draft' as any,
        tags: ['nodejs'],
      });

      const createCall = mockPrisma.article.create.mock.calls[0][0];
      expect(
        createCall.data.tags.create || createCall.data.tags.connectOrCreate,
      ).toBeDefined();
    });

    it('should not return password fields', async () => {
      mockPrisma.article.create.mockResolvedValue({
        id: '1',
        title: 'Test',
        content: 'Content',
        status: 'DRAFT',
        tags: [],
        authorId: null,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({
        title: 'Test',
        content: 'Content',
        status: 'draft' as any,
        tags: [],
      });

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('formatArticle', () => {
    it('should default tags to an empty array when missing', async () => {
      mockPrisma.article.create.mockResolvedValue({
        id: '1',
        title: 'Test',
        content: 'Content',
        status: 'DRAFT',
        authorId: null,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({
        title: 'Test',
        content: 'Content',
      });

      expect(result.tags).toEqual([]);
    });

    it('should default status to DRAFT when status not provided', async () => {
      mockPrisma.article.create.mockResolvedValue({
        id: '1',
        title: 'Test',
        content: 'Content',
        status: 'DRAFT',
        authorId: null,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.create({
        title: 'Test',
        content: 'Content',
      });

      const createCall = mockPrisma.article.create.mock.calls[0][0];
      expect(createCall.data.status).toBe('DRAFT');
    });
  });

  describe('update', () => {
    it('should update article', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({
        id: '1',
        title: 'Old',
        content: 'Old',
        status: 'DRAFT',
        tags: [],
        authorId: null,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.article.update.mockResolvedValue({
        id: '1',
        title: 'New',
        content: 'New',
        status: 'PUBLISHED',
        tags: [],
        authorId: null,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.update('1', {
        title: 'New',
        content: 'New',
        status: 'published' as any,
      });

      expect(result.status).toBe('published');
    });

    it('should replace tags when provided', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({
        id: '1',
        title: 'Old',
        content: 'Old',
        status: 'DRAFT',
        tags: [],
        authorId: null,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.article.update.mockResolvedValue({
        id: '1',
        title: 'Old',
        content: 'Old',
        status: 'DRAFT',
        tags: [{ name: 'nodejs' }],
        authorId: null,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.update('1', { tags: ['nodejs'] });

      const updateCall = mockPrisma.article.update.mock.calls[0][0];
      expect(updateCall.data.tags).toEqual({
        set: [],
        connectOrCreate: [
          {
            where: { name: 'nodejs' },
            create: { name: 'nodejs' },
          },
        ],
      });
    });

    it('should throw NotFoundException if article not found', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      await expect(
        service.update('uuid', { title: 'New', content: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update author and category when provided', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({
        id: '1',
        title: 'Old',
        content: 'Old',
        status: 'DRAFT',
        tags: [],
        authorId: null,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.article.update.mockResolvedValue({
        id: '1',
        title: 'Old',
        content: 'Old',
        status: 'DRAFT',
        tags: [],
        authorId: 'auth',
        categoryId: 'cat',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.update('1', { authorId: 'auth', categoryId: 'cat' });

      const updateCall = mockPrisma.article.update.mock.calls[0][0];
      expect(updateCall.data.authorId).toBe('auth');
      expect(updateCall.data.categoryId).toBe('cat');
    });
  });

  describe('remove', () => {
    it('should delete article', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({
        id: '1',
        title: 'Test',
        content: 'Content',
        status: 'DRAFT',
        tags: [],
        authorId: null,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.article.delete.mockResolvedValue({});

      await service.remove('1');

      expect(mockPrisma.article.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if article not found', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      await expect(service.remove('uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exists', () => {
    it('should return true when the article exists', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({ id: '1' });

      const result = await service.exists('1');

      expect(result).toBe(true);
    });

    it('should return false when the article does not exist', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const result = await service.exists('uuid');

      expect(result).toBe(false);
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated articles', async () => {
      const articles = [
        {
          id: '1',
          title: 'Test',
          content: 'Content',
          status: 'DRAFT',
          tags: [],
          authorId: null,
          categoryId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrisma.$transaction.mockResolvedValue([10, articles]);

      const result = await service.findAllPaginated({}, 1, 5);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result.total).toBe(10);
    });

    it('should use default page and limit', async () => {
      mockPrisma.$transaction.mockResolvedValue([0, []]);

      const result = await service.findAllPaginated({}, 1, 10);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });
});
