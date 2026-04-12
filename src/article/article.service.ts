import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleStatus } from './article.entity';

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: {
    status?: ArticleStatus;
    categoryId?: string;
    tag?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.tag) where.tags = { some: { name: filters.tag } };

    const orderBy: any = filters.sortBy
      ? { [filters.sortBy]: filters.order ?? 'asc' }
      : { createdAt: 'desc' };

    const articles = await this.prisma.article.findMany({
      where,
      orderBy,
      include: { tags: true },
    });

    return articles.map(this.formatArticle);
  }

  async findAllPaginated(
    filters: { status?: ArticleStatus; categoryId?: string; tag?: string },
    page: number = 1,
    limit: number = 10,
    sortBy?: string,
    order: 'asc' | 'desc' = 'asc',
  ) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.tag) where.tags = { some: { name: filters.tag } };

    const orderBy: any = sortBy ? { [sortBy]: order } : { createdAt: 'desc' };

    const [total, articles] = await this.prisma.$transaction([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { tags: true },
      }),
    ]);

    return { data: articles.map(this.formatArticle), total, page, limit };
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { tags: true },
    });
    if (!article) throw new NotFoundException(`Article ${id} not found`);
    return this.formatArticle(article);
  }

  async create(dto: CreateArticleDto) {
    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        status: (dto.status as any) ?? 'DRAFT',
        authorId: dto.authorId ?? null,
        categoryId: dto.categoryId ?? null,
        tags: dto.tags?.length
          ? {
              connectOrCreate: dto.tags.map((name) => ({
                where: { name },
                create: { name },
              })),
            }
          : undefined,
      },
      include: { tags: true },
    });
    return this.formatArticle(article);
  }

  async update(id: string, dto: UpdateArticleDto) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException(`Article ${id} not found`);

    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.content && { content: dto.content }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.authorId !== undefined && { authorId: dto.authorId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.tags && {
          tags: {
            set: [],
            connectOrCreate: dto.tags.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        }),
      },
      include: { tags: true },
    });
    return this.formatArticle(updated);
  }

  async remove(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException(`Article ${id} not found`);
    await this.prisma.article.delete({ where: { id } });
  }

  async exists(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    return !!article;
  }

  private formatArticle(article: any) {
    return {
      ...article,
      tags: article.tags?.map((t: any) => t.name) ?? [],
    };
  }
}
