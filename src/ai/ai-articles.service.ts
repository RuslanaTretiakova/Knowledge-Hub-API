import { Injectable } from '@nestjs/common';
import { ArticleService } from '../article/article.service';
import { GeminiService } from './gemini.service';
import { AiCacheService } from './ai-cache.service';
import { AiUsageService } from './ai-usage.service';
import { AiSessionStore } from './ai-session.store';
import {
  buildSummarizePrompt,
  buildTranslatePrompt,
  buildAnalyzePrompt,
  buildGenericPrompt,
  type SummarizeLength,
  type AnalyzeTask,
} from './prompts';
import {
  normalizeAnalyzeResponse,
  normalizeTranslateResponse,
} from './ai-response-parse';

@Injectable()
export class AiArticlesService {
  constructor(
    private readonly articles: ArticleService,
    private readonly gemini: GeminiService,
    private readonly cache: AiCacheService,
    private readonly usage: AiUsageService,
    private readonly sessions: AiSessionStore,
  ) {}

  async summarize(articleId: string, maxLength: SummarizeLength) {
    const started = Date.now();
    const article = await this.articles.findOne(articleId);
    const key = this.cache.summarizeKey(
      articleId,
      article.updatedAt,
      maxLength,
    );
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      this.usage.recordCacheHit();
      this.usage.recordRequest('summarize', Date.now() - started);
      const summary = cached;
      const originalLength = article.content.length;
      return {
        articleId,
        summary,
        originalLength,
        summaryLength: summary.length,
      };
    }

    this.usage.recordCacheMiss();
    const prompt = buildSummarizePrompt({
      title: article.title,
      content: article.content,
      maxLength,
    });
    const { text, usage } = await this.gemini.generateText(prompt);
    const summary = text.trim();
    this.cache.set(key, summary);
    this.usage.recordRequest('summarize', Date.now() - started, usage);
    return {
      articleId,
      summary,
      originalLength: article.content.length,
      summaryLength: summary.length,
    };
  }

  async translate(
    articleId: string,
    targetLanguage: string,
    sourceLanguage?: string,
  ) {
    const started = Date.now();
    const article = await this.articles.findOne(articleId);
    const key = this.cache.translateKey(
      articleId,
      article.updatedAt,
      targetLanguage,
      sourceLanguage ?? '',
    );
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      try {
        const parsed = JSON.parse(cached) as {
          translatedText: string;
          detectedLanguage: string;
        };
        this.usage.recordCacheHit();
        this.usage.recordRequest('translate', Date.now() - started);
        return {
          articleId,
          translatedText: parsed.translatedText,
          detectedLanguage: parsed.detectedLanguage,
        };
      } catch {
        this.cache.delete(key);
      }
    }

    this.usage.recordCacheMiss();
    const prompt = buildTranslatePrompt({
      title: article.title,
      content: article.content,
      targetLanguage,
      sourceLanguage,
    });
    const { text, usage } = await this.gemini.generateText(prompt);
    const { translatedText, detectedLanguage } = normalizeTranslateResponse(
      text,
      article.title,
      article.content,
    );
    this.cache.set(key, JSON.stringify({ translatedText, detectedLanguage }));
    this.usage.recordRequest('translate', Date.now() - started, usage);
    return { articleId, translatedText, detectedLanguage };
  }

  async analyze(articleId: string, task: AnalyzeTask) {
    const started = Date.now();
    const article = await this.articles.findOne(articleId);
    const prompt = buildAnalyzePrompt({
      title: article.title,
      content: article.content,
      task,
    });
    const { text, usage } = await this.gemini.generateText(prompt);
    const normalized = normalizeAnalyzeResponse(text);
    this.usage.recordRequest('analyze', Date.now() - started, usage);
    return {
      articleId,
      analysis: normalized.analysis,
      suggestions: normalized.suggestions,
      severity: normalized.severity,
    };
  }

  async generateFreeform(prompt: string, sessionId?: string) {
    const started = Date.now();
    const { sessionId: sid, history } = this.sessions.resolveSession(sessionId);
    const fullPrompt = buildGenericPrompt(prompt, history);
    const { text, usage } = await this.gemini.generateText(fullPrompt);
    this.sessions.appendTurns(sid, prompt, text.trim());
    this.usage.recordRequest('generate', Date.now() - started, usage);
    return { sessionId: sid, text: text.trim() };
  }
}
