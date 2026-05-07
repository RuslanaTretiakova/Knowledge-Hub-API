import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { AiArticlesService } from './ai-articles.service';
import { AiUsageService } from './ai-usage.service';
import { AiRateLimitGuard } from './ai-rate-limit.guard';
import { SkipAiRateLimit } from './decorators/skip-ai-rate-limit.decorator';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { GenerateAiDto } from './dto/generate-ai.dto';

@ApiTags('Ai')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(AiRateLimitGuard)
export class AiController {
  constructor(
    private readonly aiArticles: AiArticlesService,
    private readonly aiUsage: AiUsageService,
  ) {}

  @Get('usage')
  @SkipAiRateLimit()
  @ApiOperation({ summary: 'Get AI usage and cache stats' })
  getUsage() {
    return this.aiUsage.getSnapshot();
  }

  @Post('articles/:articleId/summarize')
  @ApiOperation({ summary: 'Summarize article' })
  async summarize(
    @Param('articleId', ParseUuidPipe) articleId: string,
    @Body() dto: SummarizeArticleDto,
  ) {
    const maxLength = dto.maxLength ?? 'medium';
    return this.aiArticles.summarize(articleId, maxLength);
  }

  @Post('articles/:articleId/translate')
  @ApiOperation({ summary: 'Translate article' })
  async translate(
    @Param('articleId', ParseUuidPipe) articleId: string,
    @Body() dto: TranslateArticleDto,
  ) {
    return this.aiArticles.translate(
      articleId,
      dto.targetLanguage,
      dto.sourceLanguage,
    );
  }

  @Post('articles/:articleId/analyze')
  @ApiOperation({ summary: 'Analyze article' })
  async analyze(
    @Param('articleId', ParseUuidPipe) articleId: string,
    @Body() dto: AnalyzeArticleDto,
  ) {
    const task = dto.task ?? 'review';
    return this.aiArticles.analyze(articleId, task);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate from prompt' })
  async generate(@Body() dto: GenerateAiDto) {
    return this.aiArticles.generateFreeform(dto.prompt, dto.sessionId);
  }
}
