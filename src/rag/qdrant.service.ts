import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import type { Schemas } from '@qdrant/js-client-rest';
import { loadRagSettings } from './rag-settings';

const TEXT_EMBEDDING_004_DIM = 768;

export type RagPointPayload = {
  articleId: string;
  articleTitle: string;
  articleStatus: string;
  categoryId: string | null;
  tagNames: string[];
  chunkIndex: number;
  chunkText: string;
};

@Injectable()
export class QdrantService {
  private readonly logger = new Logger(QdrantService.name);
  private client: QdrantClient;
  private collection: string;
  private readonly url: string;

  constructor() {
    const settings = loadRagSettings();
    if (settings.vectorDbProvider !== 'qdrant') {
      throw new Error(
        `Unsupported RAG_VECTOR_DB_PROVIDER: ${settings.vectorDbProvider}`,
      );
    }
    this.url = settings.vectorDbUrl;
    this.collection = settings.vectorCollection;
    this.client = new QdrantClient({ url: this.url });
  }

  async ensureCollection(vectorSize: number = TEXT_EMBEDDING_004_DIM) {
    try {
      const cols = await this.client.getCollections();
      const exists = cols.collections?.some((c) => c.name === this.collection);
      if (!exists) {
        await this.client.createCollection(this.collection, {
          vectors: { size: vectorSize, distance: 'Cosine' },
        });
      }
    } catch (err) {
      this.logQdrantError('ensureCollection', err);
      throw new ServiceUnavailableException(
        'Vector database is unavailable. Try again later.',
      );
    }
  }

  async recreateCollection(vectorSize: number = TEXT_EMBEDDING_004_DIM) {
    try {
      const cols = await this.client.getCollections();
      const exists = cols.collections?.some((c) => c.name === this.collection);
      if (exists) {
        await this.client.deleteCollection(this.collection);
      }
      await this.client.createCollection(this.collection, {
        vectors: { size: vectorSize, distance: 'Cosine' },
      });
    } catch (err) {
      this.logQdrantError('recreateCollection', err);
      throw new ServiceUnavailableException(
        'Vector database is unavailable. Try again later.',
      );
    }
  }

  async countByArticleId(articleId: string): Promise<number> {
    try {
      const res = await this.client.count(this.collection, {
        filter: this.articleIdFilter(articleId),
        exact: true,
      });
      return res.count ?? 0;
    } catch (err) {
      this.logQdrantError('countByArticleId', err);
      throw new ServiceUnavailableException(
        'Vector database is unavailable. Try again later.',
      );
    }
  }

  async deleteByArticleId(articleId: string): Promise<number> {
    const before = await this.countByArticleId(articleId);
    if (!before) return 0;
    try {
      await this.client.delete(this.collection, {
        wait: true,
        filter: this.articleIdFilter(articleId),
      });
      return before;
    } catch (err) {
      this.logQdrantError('deleteByArticleId', err);
      throw new ServiceUnavailableException(
        'Vector database is unavailable. Try again later.',
      );
    }
  }

  async upsertPoints(
    points: Schemas['PointStruct'][],
  ): Promise<void> {
    if (!points.length) return;
    try {
      await this.client.upsert(this.collection, { wait: true, points });
    } catch (err) {
      this.logQdrantError('upsertPoints', err);
      throw new ServiceUnavailableException(
        'Vector database is unavailable. Try again later.',
      );
    }
  }

  async search(
    vector: number[],
    limit: number,
    filter?: Schemas['Filter'],
  ): Promise<
    {
      score: number;
      payload: RagPointPayload | undefined;
    }[]
  > {
    try {
      const hits = await this.client.search(this.collection, {
        vector,
        limit,
        filter,
        with_payload: true,
      });
      return (hits ?? []).map((h) => ({
        score: h.score ?? 0,
        payload: h.payload as RagPointPayload | undefined,
      }));
    } catch (err) {
      this.logQdrantError('search', err);
      throw new ServiceUnavailableException(
        'Vector database is unavailable. Try again later.',
      );
    }
  }

  buildSearchFilter(params: {
    articleStatus?: string;
    categoryId?: string;
    tags?: string[];
  }): Schemas['Filter'] | undefined {
    const must: Schemas['Condition'][] = [];
    if (params.articleStatus) {
      must.push({
        key: 'articleStatus',
        match: { value: params.articleStatus },
      });
    }
    if (params.categoryId) {
      must.push({
        key: 'categoryId',
        match: { value: params.categoryId },
      });
    }
    if (params.tags?.length) {
      for (const tag of params.tags) {
        must.push({
          key: 'tagNames',
          match: { value: tag },
        });
      }
    }
    return must.length ? { must } : undefined;
  }

  private articleIdFilter(articleId: string): Schemas['Filter'] {
    return {
      must: [{ key: 'articleId', match: { value: articleId } }],
    };
  }

  private logQdrantError(op: string, err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    this.logger.warn(`Qdrant ${op} failed (${this.url}): ${msg}`);
  }
}
