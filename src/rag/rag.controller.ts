import {
  Body,
  Controller,
  Delete,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { AiRateLimitGuard } from '../ai/ai-rate-limit.guard';
import { SkipAiRateLimit } from '../ai/decorators/skip-ai-rate-limit.decorator';
import { RagIndexingService } from './rag-indexing.service';
import { RagRetrievalService } from './rag-retrieval.service';
import { QdrantService } from './qdrant.service';
import { ReindexRequestDto } from './dto/reindex.dto';
import { RagSearchRequestDto } from './dto/rag-search.dto';

@ApiTags('Rag')
@ApiBearerAuth()
@Controller('ai/rag')
@UseGuards(AiRateLimitGuard)
export class RagController {
  constructor(
    private readonly indexing: RagIndexingService,
    private readonly retrieval: RagRetrievalService,
    private readonly qdrant: QdrantService,
  ) {}

  @Post('index')
  @SkipAiRateLimit()
  @ApiOperation({ summary: 'Build or refresh vector index from articles' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 503, description: 'Vector DB or Gemini unavailable' })
  async index(@Body() dto: ReindexRequestDto) {
    return this.indexing.reindex({
      onlyPublished: dto.onlyPublished,
      articleIds: dto.articleIds,
    });
  }

  @Post('search')
  @ApiOperation({ summary: 'Semantic search over indexed article chunks' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 503, description: 'Vector DB or Gemini unavailable' })
  async search(@Body() dto: RagSearchRequestDto) {
    const limit = Math.min(20, Math.max(1, dto.limit ?? 5));
    const results = await this.retrieval.search({
      query: dto.query,
      limit,
      articleStatus: dto.articleStatus,
      categoryId: dto.categoryId,
      tags: dto.tags,
    });
    return { results };
  }

  @Delete('index/articles/:articleId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove all vectors for an article' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 503, description: 'Vector DB unavailable' })
  async deleteArticleVectors(
    @Param('articleId', ParseUuidPipe) articleId: string,
  ) {
    await this.qdrant.ensureCollection();
    const removed = await this.qdrant.deleteByArticleId(articleId);
    if (!removed) {
      throw new NotFoundException(
        `No index entries found for article ${articleId}`,
      );
    }
  }
}
