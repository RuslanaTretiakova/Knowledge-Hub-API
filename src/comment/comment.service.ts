import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async findByArticle(articleId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { articleId },
    });
    return comments.map(this.formatComment);
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    return this.formatComment(comment);
  }

  async create(dto: CreateCommentDto) {
    const article = await this.prisma.article.findUnique({
      where: { id: dto.articleId },
    });
    if (!article) {
      throw new UnprocessableEntityException(
        `Article ${dto.articleId} not found`,
      );
    }
    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        articleId: dto.articleId,
        authorId: dto.authorId ?? null,
      },
    });
    return this.formatComment(comment);
  }

  async remove(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    await this.prisma.comment.delete({ where: { id } });
  }

  private formatComment(comment: any) {
    return {
      ...comment,
      createdAt: new Date(comment.createdAt).getTime(),
    };
  }
}
