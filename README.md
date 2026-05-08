# 🧲 Job Platform API

A scalable job aggregation and search platform built with **NestJS**, **MongoDB**, **Redis**, **Bull**, and **Meilisearch**. Automatically ingests real job listings from multiple sources, normalizes inconsistent data, deduplicates entries, and exposes a fast REST API with typo-tolerant full-text search, advanced filtering, async queue processing, and Redis caching.

---

## 🧭 Why I Built This

Job hunting is fragmented. Listings are spread across dozens of platforms, each with different formats, missing fields, and duplicate entries. I wanted to build a system that:

- **Aggregates** jobs from multiple sources into one unified API
- **Normalizes** inconsistent data (different salary formats, job type strings, missing fields)
- **Deduplicates** intelligently so the same job from two sources doesn't appear twice
- **Searches** across everything in milliseconds with typo tolerance
- **Scales** without blocking — ingestion runs in the background, not on the request cycle

This project is also a deliberate exercise in building production-style backend infrastructure: async queues, caching layers, search engines, and scheduler-driven pipelines — not just a CRUD API.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT / POSTMAN                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP requests
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NestJS API (Port 3001)                      │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐  │
│   │ JobsModule  │  │SearchModule │  │  IngestionModule     │  │
│   │ GET /jobs   │  │ GET /search │  │  POST /ingestion/run │  │
│   │ GET /jobs/:id│  │ /jobs       │  │  GET  /status        │  │
│   └──────┬──────┘  └──────┬──────┘  └──────────┬───────────┘  │
│          │                │                     │              │
└──────────┼────────────────┼─────────────────────┼──────────────┘
           │                │                     │
           ▼                ▼                     ▼
┌──────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│   MongoDB    │  │   Meilisearch    │  │   Redis (Bull)      │
│   Port 27018 │  │   Port 7700      │  │   Port 6379         │
│              │  │                  │  │                     │
│ - jobs       │  │ - jobs index     │  │ - ingestion queue   │
│ - companies  │  │   (searchable,   │  │ - job results       │
│ - skills     │  │    filterable,   │  │ - retry state       │
│ - sources    │  │    typo-tolerant)│  │ - response cache    │
└──────────────┘  └──────────────────┘  └──────────┬──────────┘
                                                    │
                          ┌─────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Ingestion Processor                          │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  ┌─────────┐  │
│  │  Remotive   │  │  Arbeitnow  │  │ RemoteOK │  │   WWR   │  │
│  │  Provider   │  │  Provider   │  │ Provider │  │ Scraper │  │
│  └──────┬──────┘  └──────┬──────┘  └────┬─────┘  └────┬────┘  │
│         └────────────────┴──────────────┴──────────────┘       │
│                                  │                              │
│                                  ▼                              │
│                     ┌────────────────────┐                      │
│                     │    Normalizer      │                      │
│                     │  (unified format)  │                      │
│                     └────────┬───────────┘                      │
│                              │                                  │
│              ┌───────────────┼───────────────┐                  │
│              ▼               ▼               ▼                  │
│     Company resolve   Skill resolve    Deduplication            │
│     (findOrCreate)    (findOrCreate)  (externalId+source)       │
│              └───────────────┴───────────────┘                  │
│                              │                                  │
│                    ┌─────────▼──────────┐                       │
│                    │  MongoDB + Meili   │                       │
│                    │  sync + cache bust │                       │
│                    └────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Cron Scheduler                             │
│                                                                 │
│   Every 6h  → queue full ingestion (all sources)               │
│   Every 2h  → queue Remotive        (on the hour)              │
│   Every 2h  → queue RemoteOK        (+15 min offset)           │
│   Every 2h  → queue Arbeitnow       (+30 min offset)           │
│   Every 2h  → queue WeWorkRemotely  (+45 min offset)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📡 System Overview

### Data Flow

1. **Scheduler** fires a cron every 2–6 hours and adds a job to the Bull queue in Redis
2. **Processor** picks up the job and calls the appropriate provider
3. **Provider** fetches raw data from the external API or scrapes the RSS feed
4. **Normalizer** maps the raw response to a unified `NormalizedJob` format
5. **IngestionService** resolves company names and skill tags to MongoDB documents (creating them if they don't exist), then upserts the job using `externalId + source` as a deduplication key
6. After saving, jobs are synced to **Meilisearch** for search indexing
7. The **Redis cache** is invalidated so the next API request serves fresh data

### Request Flow

```
GET /api/v1/search/jobs?q=backend&isRemote=true
        ↓
  ThrottlerGuard (rate limit check)
        ↓
  CacheInterceptor (Redis cache hit? → return immediately)
        ↓ cache miss
  SearchService.search()
        ↓
  Meilisearch query (< 5ms)
        ↓
  Response cached in Redis (TTL: 2 min)
        ↓
  Return paginated results with highlights
```

---

## 🛠 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | NestJS | Modular, DI, decorators, production-ready |
| Database | MongoDB + Mongoose | Flexible schema for inconsistent job data |
| Search | Meilisearch | Typo tolerance, sub-5ms queries, easy setup |
| Queue | Bull + Redis | Async ingestion, retries, exponential backoff |
| Cache | Redis (cache-manager) | Fast repeated queries, reduced DB load |
| Scheduler | @nestjs/schedule | Cron-based auto-ingestion |
| Scraping | Playwright + fast-xml-parser | Headless browser + RSS parsing |
| HTTP Client | Axios (@nestjs/axios) | Provider API calls |
| Validation | class-validator | DTO validation with decorators |
| Config | @nestjs/config | Environment-based configuration |

---

## ⚖️ Tradeoffs

### MongoDB over PostgreSQL
The roadmap originally called for PostgreSQL. I switched to MongoDB because job data is inherently inconsistent — different sources return wildly different shapes. MongoDB's flexible schema handles missing fields, nested tags, and varying salary formats without migration overhead. The tradeoff is weaker relational integrity: company and skill references are ObjectIds without foreign key constraints.

### Bull v3 over BullMQ
BullMQ is the modern successor to Bull but requires a different NestJS adapter and has breaking API changes. Bull v3 is stable, well-documented, and integrates cleanly with `@nestjs/bull`. For this project's scope the features are equivalent. Migration to BullMQ is a clear future upgrade path.

### Meilisearch over Elasticsearch
Elasticsearch is more powerful but operationally heavy — it needs significant memory and configuration. Meilisearch is simpler to run, faster to configure, and delivers typo-tolerant full-text search out of the box with a single Docker container. The tradeoff is less advanced aggregation and analytics capability.

### Upsert over check-then-insert for deduplication
Instead of checking for duplicates before inserting, every job write uses `findOneAndUpdate` with `upsert: true` and a compound index on `externalId + source`. This is atomic, avoids race conditions in concurrent ingestion runs, and means deduplication is a side effect of the write operation rather than a separate step.

### Auto-creating companies and skills
When a job references a company or skill that doesn't exist yet, the system creates it on the fly using `findOrCreate`. This keeps ingestion fast and self-healing but means company records start with minimal data (name only). Enrichment can be added later as a separate pipeline.

### Cache invalidation via full reset
After each ingestion run the entire Redis cache is reset rather than invalidating specific keys. This is simpler to implement and guarantees consistency, but it's a blunt instrument — it evicts valid cached responses for endpoints unrelated to the updated data. Tag-based cache invalidation would be more efficient at scale.

---

## 📁 Project Structure

```
src/
├── app.module.ts
├── main.ts
├── config/
│   └── configuration.ts
├── common/
│   ├── dto/
│   │   └── pagination.dto.ts
│   ├── health/
│   │   └── health.controller.ts
│   ├── interfaces/
│   │   └── paginated-result.interface.ts
│   └── middleware/
│       └── logger.middleware.ts
└── modules/
    ├── jobs/
    │   ├── dto/
    │   ├── schemas/
    │   ├── jobs.controller.ts
    │   ├── jobs.service.ts
    │   └── jobs.module.ts
    ├── companies/
    ├── skills/
    ├── sources/
    ├── ingestion/
    │   ├── normalizers/
    │   │   └── job.normalizer.ts
    │   ├── providers/
    │   │   ├── remotive.provider.ts
    │   │   ├── arbeitnow.provider.ts
    │   │   ├── remoteok.provider.ts
    │   │   └── weworkremotely.scraper.ts
    │   ├── ingestion.service.ts
    │   ├── ingestion.controller.ts
    │   └── ingestion.module.ts
    ├── queue/
    │   ├── queue.constants.ts
    │   ├── queue.module.ts
    │   ├── ingestion.processor.ts
    │   └── ingestion.scheduler.ts
    └── search/
        ├── dto/
        │   └── search-jobs.dto.ts
        ├── search.service.ts
        ├── search.controller.ts
        └── search.module.ts
```

---

## ⚙️ Prerequisites

- Node.js 18+
- Docker + Docker Compose
- npm

---

## 🏁 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/seifbenkarim10/Job-Platform-API
cd job-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27018/job-platform
REDIS_HOST=localhost
REDIS_PORT=6379
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=masterKey123
```

### 4. Start infrastructure

```bash
docker compose up -d
```

### 5. Run the application

```bash
npm run start:dev
```

### 6. Seed initial data

```bash
# trigger first ingestion
curl -X POST http://localhost:3001/api/v1/ingestion/run

# index existing jobs in Meilisearch
curl -X POST http://localhost:3001/api/v1/search/reindex
```

---

## 📡 API Reference

### Health
```
GET /api/v1/health
```

### Jobs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/jobs` | List jobs with filters + pagination |
| `GET` | `/api/v1/jobs/:id` | Get single job |
| `POST` | `/api/v1/jobs` | Create a job manually |
| `DELETE` | `/api/v1/jobs/:id` | Deactivate a job |

#### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 100) |
| `search` | string | Full-text search |
| `location` | string | Filter by location |
| `isRemote` | boolean | Remote jobs only |
| `type` | string | `full-time` `part-time` `contract` `freelance` `internship` |
| `experienceLevel` | string | `junior` `mid` `senior` `lead` |
| `salaryMin` | number | Minimum salary |
| `salaryMax` | number | Maximum salary |

### Search (Meilisearch-powered)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/search/jobs` | Typo-tolerant full-text search |
| `POST` | `/api/v1/search/reindex` | Reindex all jobs from MongoDB |

#### Additional Parameters

| Parameter | Type | Description |
|---|---|---|
| `q` | string | Full-text query (typo-tolerant) |
| `skills` | string | Comma-separated e.g. `react,node` |
| `company` | string | Filter by company name |

### Ingestion

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/ingestion/run` | Queue full ingestion |
| `POST` | `/api/v1/ingestion/run/:source` | Queue single source |
| `GET` | `/api/v1/ingestion/status` | Queue status |

**Sources:** `remotive` `arbeitnow` `remoteok` `wwr`

### Companies

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/companies` | List all companies |
| `GET` | `/api/v1/companies/:id` | Get single company |
| `POST` | `/api/v1/companies` | Create a company |

---

## 📊 Queue Dashboard

```
http://localhost:3001/queues
```

Monitor waiting, active, completed, and failed jobs in real time. Retry failed jobs directly from the UI.

---

## ⏱ Ingestion Schedule

| Trigger | Frequency |
|---|---|
| All sources | Every 6 hours |
| Remotive | Every 2 hours (on the hour) |
| RemoteOK | Every 2 hours (+15 min) |
| Arbeitnow | Every 2 hours (+30 min) |
| WeWorkRemotely | Every 2 hours (+45 min) |

Sources are staggered to avoid hitting external APIs simultaneously.

---

## 🗄 Data Model

```typescript
Job {
  title, description
  company: ObjectId    → Company { name, website, logo, location }
  source:  ObjectId    → Source  { name, url, lastScrapedAt }
  skills:  ObjectId[]  → Skill   { name, category }
  location, isRemote, type, experienceLevel
  salaryMin, salaryMax, salaryCurrency
  applyUrl, externalId, isActive, postedAt
}
```

---

## 🔮 Future Improvements

### Short term
- **Authentication** — JWT-based user accounts with saved jobs, alerts, and personalized feeds
- **Next.js frontend** — job board UI with search, filters, and job detail pages
- **Deployment** — Dockerized production setup with CI/CD pipeline

### Medium term
- **NLP skill extraction** — extract skills from job descriptions automatically instead of relying on source tags
- **Salary normalization** — convert all salaries to a common currency and annual frequency
- **Company enrichment** — fetch logos, descriptions, and metadata for auto-created companies
- **Tag-based cache invalidation** — invalidate only affected cache keys instead of full reset
- **Webhook support** — notify external services when new jobs matching saved criteria arrive

### Long term
- **Job scoring** — rank jobs by relevance to a user's profile and preferences
- **Market analytics** — trending skills, salary distributions, hiring velocity by company
- **Email / Slack alerts** — notify users when new jobs match their saved filters
- **BullMQ migration** — upgrade from Bull v3 for better TypeScript support and modern API
- **Elasticsearch** — replace Meilisearch for advanced aggregations and analytics at scale

---

## 🧪 Scripts

```bash
npm run start:dev      # development with hot reload
npm run build          # compile TypeScript
npm run start:prod     # run compiled build
npm run lint           # ESLint
npm run test           # unit tests
npm run test:e2e       # e2e tests
```

---

## 📌 Roadmap

- [x] Week 1 — Project setup + architecture
- [x] Week 2 — Database schemas + core REST API
- [x] Week 3 — Multi-source data ingestion pipeline
- [x] Week 4 — Async queue system + cron scheduler
- [x] Week 5 — Meilisearch integration + advanced search
- [x] Week 6 — Redis caching + rate limiting + request logging
- [ ] Week 7 — Authentication + user accounts
- [ ] Week 8 — Next.js frontend
- [ ] Week 9 — Deployment + DevOps

---

## 📄 License

MIT