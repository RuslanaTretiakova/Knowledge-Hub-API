import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CommentService } from '../comment/comment.service';
import { Article, ArticleStatus } from './article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticleService {
  private articles: Article[] = [];

  constructor(
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  findOne(id: string): Article {
    const article = this.articles.find((a) => a.id === id);
    if (!article) throw new NotFoundException(`Article ${id} not found`);
    return article;
  }

  create(dto: CreateArticleDto): Article {
    const now = Date.now();
    const article: Article = {
      id: randomUUID(),
      title: dto.title,
      content: dto.content,
      status: dto.status ?? ArticleStatus.DRAFT,
      authorId: dto.authorId ?? null,
      categoryId: dto.categoryId ?? null,
      tags: dto.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.articles.push(article);
    return article;
  }

  update(id: string, dto: UpdateArticleDto): Article {
    const article = this.findOne(id);
    Object.assign(article, { ...dto, updatedAt: Date.now() });
    return article;
  }

  remove(id: string): void {
    const index = this.articles.findIndex((a) => a.id === id);
    if (index === -1) throw new NotFoundException(`Article ${id} not found`);
    this.articles.splice(index, 1);
    this.commentService.deleteByArticle(id);
  }

  nullifyAuthor(authorId: string): void {
    this.articles
      .filter((a) => a.authorId === authorId)
      .forEach((a) => {
        a.authorId = null;
        a.updatedAt = Date.now();
      });
  }

  nullifyCategory(categoryId: string): void {
    this.articles
      .filter((a) => a.categoryId === categoryId)
      .forEach((a) => {
        a.categoryId = null;
        a.updatedAt = Date.now();
      });
  }

  exists(id: string): boolean {
    return this.articles.some((a) => a.id === id);
  }

  findAll(filters: {
    status?: ArticleStatus;
    categoryId?: string;
    tag?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Article[] {
    let result = this.articles.filter((a) => {
      if (filters.status && a.status !== filters.status) return false;
      if (filters.categoryId && a.categoryId !== filters.categoryId)
        return false;
      if (filters.tag && !a.tags.includes(filters.tag)) return false;
      return true;
    });

    if (filters.sortBy) {
      result = [...result].sort((a, b) => {
        const aVal = (a as any)[filters.sortBy];
        const bVal = (b as any)[filters.sortBy];
        if (aVal < bVal) return filters.order === 'desc' ? 1 : -1;
        if (aVal > bVal) return filters.order === 'desc' ? -1 : 1;
        return 0;
      });
    }

    return result;
  }

  findAllPaginated(
    filters: { status?: ArticleStatus; categoryId?: string; tag?: string },
    page: number = 1,
    limit: number = 10,
    sortBy?: string,
    order: 'asc' | 'desc' = 'asc',
  ): { data: Article[]; total: number; page: number; limit: number } {
    let result = this.articles.filter((a) => {
      if (filters.status && a.status !== filters.status) return false;
      if (filters.categoryId && a.categoryId !== filters.categoryId)
        return false;
      if (filters.tag && !a.tags.includes(filters.tag)) return false;
      return true;
    });

    if (sortBy) {
      result = [...result].sort((a, b) => {
        const aVal = (a as any)[sortBy];
        const bVal = (b as any)[sortBy];
        if (aVal < bVal) return order === 'desc' ? 1 : -1;
        if (aVal > bVal) return order === 'desc' ? -1 : 1;
        return 0;
      });
    }

    const total = result.length;
    const start = (page - 1) * limit;
    return { data: result.slice(start, start + limit), total, page, limit };
  }
}
