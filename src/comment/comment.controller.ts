import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Comments')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: 'Get comments for article' })
  @ApiQuery({ name: 'articleId', required: true })
  findByArticle(@Query('articleId') articleId?: string) {
    if (!articleId) {
      throw new BadRequestException('articleId query parameter is required');
    }
    const pipe = new ParseUuidPipe();
    pipe.transform(articleId);
    return this.commentService.findByArticle(articleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment by id' })
  findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.commentService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create comment' })
  create(@Body() dto: CreateCommentDto, @Request() req: any) {
    const role = req.user?.role?.toUpperCase();
    if (role === 'VIEWER')
      throw new ForbiddenException('Viewers cannot create comments');
    return this.commentService.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete comment' })
  async remove(@Param('id', ParseUuidPipe) id: string, @Request() req: any) {
    const role = req.user?.role?.toUpperCase();
    const userId = req.user?.userId;

    if (role === 'ADMIN') {
      return this.commentService.remove(id);
    }

    if (role === 'EDITOR') {
      const comment = await this.commentService.findOne(id);
      if (comment.authorId !== userId) {
        throw new ForbiddenException(
          'Editors can only delete their own comments',
        );
      }
      return this.commentService.remove(id);
    }

    throw new ForbiddenException('Viewers cannot delete comments');
  }
}
