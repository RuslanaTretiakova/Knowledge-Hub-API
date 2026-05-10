import { Injectable } from '@nestjs/common';
import { GeminiService } from '../ai/gemini.service';
import { QdrantService } from './qdrant.service';
import { loadRagSettings } from './rag-settings';

export interface RagSearchHit {
  articleId: string;
  articleTitle: string;
  chunk: string;
  similarity: number;
}

@Injectable()
export class RagRetrievalService {
  constructor(
    private readonly gemini: GeminiService,
    private readonly qdrant: QdrantService,
  ) {}

  async search(params: {
    query: string;
    limit: number;
    articleStatus?: string;
    categoryId?: string;
    tags?: string[];
  }): Promise<RagSearchHit[]> {
    const settings = loadRagSettings();
    await this.qdrant.ensureCollection();

    const [vector] = await this.gemini.embedTexts([params.query]);
    const filter = this.qdrant.buildSearchFilter({
      articleStatus: params.articleStatus,
      categoryId: params.categoryId,
      tags: params.tags,
    });

    const hits = await this.qdrant.search(vector, params.limit, filter);

    return hits
      .filter((h) => h.payload)
      .map((h) => ({
        articleId: h.payload!.articleId,
        articleTitle: h.payload!.articleTitle,
        chunk: h.payload!.chunkText,
        similarity: h.score,
      }));
  }

  async retrieveForChat(params: {
    question: string;
    limit: number;
  }): Promise<RagSearchHit[]> {
    return this.search({
      query: params.question,
      limit: params.limit,
    });
  }
}
