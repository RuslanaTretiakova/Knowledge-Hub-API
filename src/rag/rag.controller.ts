import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AiRateLimitGuard } from '../ai/ai-rate-limit.guard';
import { SkipAiRateLimit } from '../ai/decorators/skip-ai-rate-limit.decorator';
import { RagIndexingService } from './rag-indexing.service';
import { ReindexRequestDto } from './dto/reindex.dto';

@ApiTags('Rag')
@ApiBearerAuth()
@Controller('ai/rag')
@UseGuards(AiRateLimitGuard)
export class RagController {
  constructor(private readonly indexing: RagIndexingService) {}

  @Post('index')
  @SkipAiRateLimit()
  @ApiOperation({ summary: 'Build or refresh vector index from articles' })
  @ApiResponse({ status: 200 })
  async index(@Body() dto: ReindexRequestDto) {
    return this.indexing.reindex({
      onlyPublished: dto.onlyPublished,
      articleIds: dto.articleIds,
    });
  }
}
