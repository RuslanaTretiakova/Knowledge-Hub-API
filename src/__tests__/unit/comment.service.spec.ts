import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommentService } from '../../comment/comment.service';

const mockPrisma = {
  comment: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  article: {
    findUnique: vi.fn(),
  },
};

describe('CommentService', () => {
  let service: CommentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CommentService(mockPrisma as any);
  });

  describe('findByArticle', () => {
    it('should return comments for article', async () => {
      mockPrisma.comment.findMany.mockResolvedValue([
        {
          id: '1',
          content: 'Comment',
          articleId: 'art-1',
          authorId: null,
          createdAt: new Date(),
        },
      ]);

      const result = await service.findByArticle('art-1');

      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return comment by id', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: '1',
        content: 'Comment',
        articleId: 'art-1',
        authorId: null,
        createdAt: new Date(),
      });

      const result = await service.findOne('1');

      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create comment', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({ id: 'art-1' });
      mockPrisma.comment.create.mockResolvedValue({
        id: '1',
        content: 'Comment',
        articleId: 'art-1',
        authorId: null,
        createdAt: new Date(),
      });

      const result = await service.create({
        content: 'Comment',
        articleId: 'art-1',
        authorId: null,
      });

      expect(result.content).toBe('Comment');
    });

    it('should throw UnprocessableEntityException if article not found', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          content: 'Comment',
          articleId: 'uuid',
          authorId: null,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('remove', () => {
    it('should delete comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: '1',
        content: 'Comment',
        articleId: 'art-1',
        authorId: null,
        createdAt: new Date(),
      });
      mockPrisma.comment.delete.mockResolvedValue({});

      await service.remove('1');

      expect(mockPrisma.comment.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);

      await expect(service.remove('uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
