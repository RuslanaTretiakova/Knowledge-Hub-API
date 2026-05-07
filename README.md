# Knowledge Hub API

REST API for Knowledge Hub platform built with Nest.js framework.

## Prerequisites

- Git — [Download & Install Git](https://git-scm.com/downloads).
- Node.js **24.10.0 or newer** — [Download Node.js](https://nodejs.org/en/download/) (includes npm).

## Downloading

```bash
git clone {repository URL}
cd <repository-folder>
```

## Installing NPM modules

```bash
npm install
```

## Environment variables

Copy `.env.example` to `.env` (on Windows: `copy .env.example .env`). Edit `.env` and set real values for your machine. **Do not commit `.env`** or paste live secrets into the repo; only `.env.example` belongs in git.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string for Prisma |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Signing keys for access / refresh tokens |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) API key for AI routes |
| `GEMINI_API_BASE_URL` | Gemini REST host (default: `https://generativelanguage.googleapis.com`) |
| `GEMINI_MODEL` | Model id (default in this project: **`gemini-2.0-flash`**) |
| `AI_RATE_LIMIT_RPM` | Max AI requests per client per rolling minute (default: `20`) |
| `AI_CACHE_TTL_SEC` | Summarize/translate cache TTL in seconds (default: `300`) |

Other entries in `.env.example` (port, logging, Postgres, legacy JWT vars) follow the same pattern: copy to `.env` and adjust as needed.

### Google Gemini API key (step by step)

1. Sign in with a Google account at [Google AI Studio](https://aistudio.google.com/).
2. Open **Get API key** (or **API keys** in the left menu).
3. Create an API key in a Google Cloud project (you can use an existing project or let the wizard create one).
4. Copy the key string and put it in `.env` as `GEMINI_API_KEY=...` (no quotes unless your tooling requires them).
5. Keep `GEMINI_MODEL` aligned with a model your key can call. This repository defaults to **`gemini-2.0-flash`**; you can change it via `GEMINI_MODEL` if Google renames or deprecates the id.

After cloning, you still need a working database, schema, and optional seed data before AI routes can load real articles (see **Running application**).

## Running application

## Running application

Start PostgreSQL and set `DATABASE_URL` in `.env` to match your instance (see `.env.example`).

Apply migrations and seed demo users and articles:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Run in development (watch mode):

```bash
npm run start:dev
```

Or build and run the compiled app:

```bash
npm run build
npm run start:prod
```

By default the API listens on port **4000** (`PORT` in `.env`). Swagger UI: http://localhost:4000/doc

### Trying the AI endpoints

Set `GEMINI_API_KEY` in `.env` before calling `/ai/*`. All AI routes expect a **Bearer** JWT (global auth), except the documented public auth routes.

1. Log in (seed user `admin` / `admin123`):

```bash
curl -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d "{\"login\":\"admin\",\"password\":\"admin123\"}"
```

2. Copy `accessToken` from the JSON response (`YOUR_JWT` below).

3. Copy an article `id` from `GET /article` (Swagger or curl).

4. Example calls (replace `YOUR_ARTICLE_ID` and `YOUR_JWT`):

```bash
curl -s -X POST "http://localhost:4000/ai/articles/YOUR_ARTICLE_ID/summarize" -H "Authorization: Bearer YOUR_JWT" -H "Content-Type: application/json" -d "{}"

curl -s -X POST "http://localhost:4000/ai/articles/YOUR_ARTICLE_ID/translate" -H "Authorization: Bearer YOUR_JWT" -H "Content-Type: application/json" -d "{\"targetLanguage\":\"pl\"}"

curl -s -X POST "http://localhost:4000/ai/articles/YOUR_ARTICLE_ID/analyze" -H "Authorization: Bearer YOUR_JWT" -H "Content-Type: application/json" -d "{\"task\":\"review\"}"

curl -s -X POST "http://localhost:4000/ai/generate" -H "Authorization: Bearer YOUR_JWT" -H "Content-Type: application/json" -d "{\"prompt\":\"Say hello in one sentence.\"}"

curl -s "http://localhost:4000/ai/usage" -H "Authorization: Bearer YOUR_JWT"
```

Missing or invalid Gemini configuration typically yields **500** (misconfigured API key) or **503** (upstream failure, timeout, or empty model output after retries).

### Known limitations (Gemini / AI)

- **Quotas:** Free tier and per-minute Google limits still apply; sustained traffic can produce **429** from Google. The app retries a few times, then may return **503**.
- **Latency:** Large prompts and slow model responses increase end-to-end time; there is no streaming API in this project.
- **Regional / product changes:** Model ids and API behavior may change; adjust `GEMINI_MODEL` and monitor Google’s docs if calls start failing.
- **Single process:** In-memory **cache**, **rate limits**, and **generate** session history are not shared across multiple Node instances.

## API Endpoints

### Users
- `GET /user` — get all users
- `GET /user/:id` — get user by id
- `POST /user` — create user (login, password, role?)
- `PUT /user/:id` — update password (oldPassword, newPassword)
- `DELETE /user/:id` — delete user

### Articles
- `GET /article` — get all articles (filters: ?status=, ?categoryId=, ?tag=)
- `GET /article/:id` — get article by id
- `POST /article` — create article (title, content, status?, authorId?, categoryId?, tags?)
- `PUT /article/:id` — update article
- `DELETE /article/:id` — delete article

### Categories
- `GET /category` — get all categories
- `GET /category/:id` — get category by id
- `POST /category` — create category (name, description)
- `PUT /category/:id` — update category
- `DELETE /category/:id` — delete category

### Comments
- `GET /comment?articleId={id}` — get comments for article
- `GET /comment/:id` — get comment by id
- `POST /comment` — create comment (content, articleId, authorId?)
- `DELETE /comment/:id` — delete comment

### Ai (Gemini)
- `GET /ai/usage` — usage totals, per-endpoint counts, token sums (when reported), average latency, cache hit ratio (in-memory since process start; not rate-limited)
- `POST /ai/articles/:id/summarize` — body: optional `maxLength` (`short` | `medium` | `detailed`, default `medium`)
- `POST /ai/articles/:id/translate` — body: `targetLanguage` (required), optional `sourceLanguage`
- `POST /ai/articles/:id/analyze` — body: optional `task` (`review` | `bugs` | `optimize` | `explain`, default `review`)
- `POST /ai/generate` — body: `prompt`, optional `sessionId` (UUID) for short conversation memory

## Cascade behavior

- Deleting a **User** sets `authorId` to null in their articles and deletes their comments
- Deleting a **Category** sets `categoryId` to null in related articles
- Deleting an **Article** deletes all its comments

## Testing

Unit tests (Vitest, no running server required):

```bash
npm run test:unit
```

With the application running, open a new terminal for integration-style Jest suites.

To run all tests without authorization:

```bash
npm run test
```

To run only one of all test suites
```bash
npm run test -- <path to suite>
```

To run all test with authorization
```bash
npm run test:auth
```

To run only specific test suite with authorization
```bash
npm run test:auth -- <path to suite>
```

To run refresh token tests
```bash
npm run test:refresh
```

To run RBAC (role-based access control) tests
```bash
npm run test:rbac
```

## Auto-fix and format
```bash
npm run lint
```
```bash
npm run format
```

## Debugging in VSCode

Press <kbd>F5</kbd> to debug.

For more information, visit: https://code.visualstudio.com/docs/editor/debugging

## Docker Hub

Docker image is available at: https://hub.docker.com/r/ruslanatretiakova/nodejs-2026q1-knowledge-hub

### Pull and run

```bash
docker pull ruslanatretiakova/nodejs-2026q1-knowledge-hub:latest
```