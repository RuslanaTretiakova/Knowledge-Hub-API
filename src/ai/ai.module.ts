import { Module } from '@nestjs/common';
import { ArticleModule } from '../article/article.module';
import { AiController } from './ai.controller';
import { AiArticlesService } from './ai-articles.service';
import { AiCacheService } from './ai-cache.service';
import { AiRateLimitGuard } from './ai-rate-limit.guard';
import { AiSessionStore } from './ai-session.store';
import { AiUsageService } from './ai-usage.service';
import { GeminiService } from './gemini.service';

@Module({
  imports: [ArticleModule],
  controllers: [AiController],
  providers: [
    GeminiService,
    AiCacheService,
    AiUsageService,
    AiSessionStore,
    AiArticlesService,
    AiRateLimitGuard,
  ],
})
export class AiModule {}
