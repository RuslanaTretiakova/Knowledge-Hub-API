import { Injectable } from '@nestjs/common';
import { v5 as uuidv5 } from 'uuid';
import type { Schemas } from '@qdrant/js-client-rest';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { chunkText } from './chunking';
import { QdrantService, type RagPointPayload } from './qdrant.service';
import { loadRagSettings } from './rag-settings';

const POINT_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

export interface ReindexParams {
  onlyPublished?: boolean;
  articleIds?: string[];
}

export interface ReindexResult {
  indexedArticles: number;
  indexedChunks: number;
  vectorCollection: string;
}

@Injectable()
export class RagIndexingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly qdrant: QdrantService,
  ) {}

  async reindex(params: ReindexParams): Promise<ReindexResult> {
    const settings = loadRagSettings();
    const onlyPublished = params.onlyPublished !== false;

    const where: {
      status?: 'PUBLISHED';
      id?: { in: string[] };
    } = {};

    if (onlyPublished) {
      where.status = 'PUBLISHED';
    }
    if (params.articleIds?.length) {
      where.id = { in: params.articleIds };
    }

    const articles = await this.prisma.article.findMany({
      where,
      include: { tags: true },
      orderBy: { id: 'asc' },
    });

    const textsToEmbed: string[] = [];
    const meta: {
      articleId: string;
      title: string;
      status: string;
      categoryId: string | null;
      tagNames: string[];
      chunkIndex: number;
      chunkText: string;
    }[] = [];

    let indexedArticles = 0;

    for (const article of articles) {
      const body = `${article.title}\n\n${article.content}`;
      const chunks = chunkText(
        body,
        settings.chunkSize,
        settings.chunkOverlap,
      );
      if (!chunks.length) {
        continue;
      }
      indexedArticles += 1;
      const status = article.status.toLowerCase();
      const tagNames = article.tags.map((t) => t.name);

      chunks.forEach((chunkTextValue, chunkIndex) => {
        textsToEmbed.push(chunkTextValue);
        meta.push({
          articleId: article.id,
          title: article.title,
          status,
          categoryId: article.categoryId,
          tagNames,
          chunkIndex,
          chunkText: chunkTextValue,
        });
      });
    }

    const selective = !!params.articleIds?.length;
    if (!selective) {
      await this.qdrant.recreateCollection();
    } else {
      await this.qdrant.ensureCollection();
      const uniqueIds = [...new Set(params.articleIds!)];
      for (const id of uniqueIds) {
        await this.qdrant.deleteByArticleId(id);
      }
    }

    if (!textsToEmbed.length) {
      return {
        indexedArticles: 0,
        indexedChunks: 0,
        vectorCollection: settings.vectorCollection,
      };
    }

    const vectors = await this.gemini.embedTexts(textsToEmbed);

    const points: Schemas['PointStruct'][] = meta.map((m, i) => {
      const payload: RagPointPayload = {
        articleId: m.articleId,
        articleTitle: m.title,
        articleStatus: m.status,
        categoryId: m.categoryId,
        tagNames: m.tagNames,
        chunkIndex: m.chunkIndex,
        chunkText: m.chunkText,
      };
      return {
        id: uuidv5(`${m.articleId}:${m.chunkIndex}`, POINT_NAMESPACE),
        vector: vectors[i],
        payload: payload as Record<string, unknown>,
      };
    });

    await this.qdrant.upsertPoints(points);

    return {
      indexedArticles,
      indexedChunks: points.length,
      vectorCollection: settings.vectorCollection,
    };
  }
}
