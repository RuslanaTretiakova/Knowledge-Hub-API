import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ArticleService } from './article.service';
import { ArticleStatus } from './article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('Articles')
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all articles' })
  @ApiQuery({ name: 'status', required: false, enum: ArticleStatus })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  findAll(
    @Query('status') status?: ArticleStatus,
    @Query('categoryId') categoryId?: string,
    @Query('tag') tag?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.articleService.findAll({
      status,
      categoryId,
      tag,
      sortBy,
      order,
    });
  }

  @Public()
  @Get('paginated')
  @ApiOperation({ summary: 'Get articles with pagination and sorting' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'status', required: false, enum: ArticleStatus })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'tag', required: false })
  findPaginated(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('status') status?: ArticleStatus,
    @Query('categoryId') categoryId?: string,
    @Query('tag') tag?: string,
  ) {
    return this.articleService.findAllPaginated(
      { status, categoryId, tag },
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      sortBy,
      order,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get article by id' })
  findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.articleService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create article' })
  create(@Body() dto: CreateArticleDto, @Request() req: any) {
    const role = req.user?.role?.toUpperCase();
    if (role === 'VIEWER')
      throw new ForbiddenException('Viewers cannot create articles');
    return this.articleService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update article' })
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateArticleDto,
    @Request() req: any,
  ) {
    const role = req.user?.role?.toUpperCase();
    if (role === 'VIEWER')
      throw new ForbiddenException('Viewers cannot update articles');
    return this.articleService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete article' })
  async remove(@Param('id', ParseUuidPipe) id: string, @Request() req: any) {
    const role = req.user?.role?.toUpperCase();
    if (role !== 'ADMIN')
      throw new ForbiddenException('Only admins can delete articles');
    return this.articleService.remove(id);
  }
}
