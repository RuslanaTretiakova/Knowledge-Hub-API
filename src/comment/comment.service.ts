import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ArticleService } from '../article/article.service';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  private comments: Comment[] = [];

  constructor(private readonly articleService: ArticleService) {}

  findByArticle(articleId: string): Comment[] {
    return this.comments.filter((c) => c.articleId === articleId);
  }

  findOne(id: string): Comment {
    const comment = this.comments.find((c) => c.id === id);
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    return comment;
  }

  create(dto: CreateCommentDto): Comment {
    if (!this.articleService.exists(dto.articleId)) {
      throw new UnprocessableEntityException(
        `Article ${dto.articleId} not found`,
      );
    }
    const comment: Comment = {
      id: randomUUID(),
      content: dto.content,
      articleId: dto.articleId,
      authorId: dto.authorId ?? null,
      createdAt: Date.now(),
    };
    this.comments.push(comment);
    return comment;
  }

  remove(id: string): void {
    const index = this.comments.findIndex((c) => c.id === id);
    if (index === -1) throw new NotFoundException(`Comment ${id} not found`);
    this.comments.splice(index, 1);
  }

  deleteByAuthor(authorId: string): void {
    this.comments = this.comments.filter((c) => c.authorId !== authorId);
  }

  deleteByArticle(articleId: string): void {
    this.comments = this.comments.filter((c) => c.articleId !== articleId);
  }
}
