import { request } from './lib';
import { StatusCodes } from 'http-status-codes';
import { articlesRoutes } from './endpoints';


const createArticleDto = (title: string, status = 'draft') => ({
  title,
  content: 'Test content',
  status,
  authorId: null,
  categoryId: null,
  tags: [],
});

describe('Pagination and Sorting (e2e)', () => {
  const unauthorizedRequest = request;
  const commonHeaders = { Accept: 'application/json' };
  const createdIds: string[] = [];

  beforeAll(async () => {
    const articles = [
      'ARTICLE_A',
      'ARTICLE_B',
      'ARTICLE_C',
      'ARTICLE_D',
      'ARTICLE_E',
    ];
    for (const title of articles) {
      const response = await unauthorizedRequest
        .post(articlesRoutes.create)
        .set(commonHeaders)
        .send(createArticleDto(title));
      createdIds.push(response.body.id);
    }
  });

  afterAll(async () => {
    for (const id of createdIds) {
      await unauthorizedRequest
        .delete(articlesRoutes.delete(id))
        .set(commonHeaders);
    }
  });

  describe('GET /article/paginated', () => {
    it('should return paginated response with correct structure', async () => {
      const response = await unauthorizedRequest
        .get('/article/paginated?page=1&limit=2')
        .set(commonHeaders);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
    });

    it('should return correct page', async () => {
      const page1 = await unauthorizedRequest
        .get('/article/paginated?page=1&limit=2')
        .set(commonHeaders);

      const page2 = await unauthorizedRequest
        .get('/article/paginated?page=2&limit=2')
        .set(commonHeaders);

      expect(page1.status).toBe(StatusCodes.OK);
      expect(page2.status).toBe(StatusCodes.OK);

      const page1Ids = page1.body.data.map((a) => a.id);
      const page2Ids = page2.body.data.map((a) => a.id);

      const hasOverlap = page1Ids.some((id) => page2Ids.includes(id));
      expect(hasOverlap).toBe(false);
    });

    it('should sort articles by title ascending', async () => {
      const response = await unauthorizedRequest
        .get('/article/paginated?sortBy=title&order=asc&limit=10')
        .set(commonHeaders);

      expect(response.status).toBe(StatusCodes.OK);
      const titles = response.body.data.map((a) => a.title);
      const sorted = [...titles].sort();
      expect(titles).toEqual(sorted);
    });

    it('should sort articles by title descending', async () => {
      const response = await unauthorizedRequest
        .get('/article/paginated?sortBy=title&order=desc&limit=10')
        .set(commonHeaders);

      expect(response.status).toBe(StatusCodes.OK);
      const titles = response.body.data.map((a) => a.title);
      const sorted = [...titles].sort().reverse();
      expect(titles).toEqual(sorted);
    });

    it('should return total count correctly', async () => {
      const response = await unauthorizedRequest
        .get('/article/paginated?limit=100')
        .set(commonHeaders);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.total).toBeGreaterThanOrEqual(5);
    });
  });
});
