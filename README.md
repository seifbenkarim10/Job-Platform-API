# 🧲 Job Platform API

A scalable job aggregation platform built with **NestJS**, **MongoDB**, and **BullMQ**. Automatically ingests real job listings from multiple sources, normalizes the data, and exposes a powerful REST API with full-text search, advanced filtering, and an async queue-based ingestion pipeline.

---

## 🚀 Features

- **Multi-source ingestion** — Remotive, Arbeitnow, RemoteOK, We Work Remotely
- **Async queue system** — BullMQ + Redis for non-blocking background jobs
- **Automatic scheduling** — Cron-based ingestion every 2–6 hours
- **Smart deduplication** — prevents duplicate jobs across runs
- **Advanced filtering** — salary range, remote, job type, experience level, skills
- **Full-text search** — native MongoDB text indexes
- **Auto company resolution** — creates companies on the fly during ingestion
- **Skill extraction** — normalizes and stores skills from job tags
- **Queue dashboard** — Bull Board UI for real-time job monitoring
- **Health check endpoint** — monitors MongoDB connectivity

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS (Node.js) |
| Database | MongoDB + Mongoose |
| Queue | Bull + Redis |
| Scheduler | @nestjs/schedule |
| Scraping | Playwright + fast-xml-parser |
| HTTP Client | Axios (@nestjs/axios) |
| Validation | class-validator + class-transformer |
| Config | @nestjs/config + dotenv |

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
│   └── interfaces/
│       └── paginated-result.interface.ts
└── modules/
    ├── jobs/
    │   ├── dto/
    │   │   ├── create-job.dto.ts
    │   │   └── filter-jobs.dto.ts
    │   ├── schemas/
    │   │   └── job.schema.ts
    │   ├── jobs.controller.ts
    │   ├── jobs.service.ts
    │   └── jobs.module.ts
    ├── companies/
    │   ├── schemas/
    │   │   └── company.schema.ts
    │   ├── companies.controller.ts
    │   ├── companies.service.ts
    │   └── companies.module.ts
    ├── skills/
    │   ├── schemas/
    │   │   └── skill.schema.ts
    │   ├── skills.service.ts
    │   └── skills.module.ts
    ├── sources/
    │   ├── schemas/
    │   │   └── source.schema.ts
    │   └── sources.module.ts
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
    └── queue/
        ├── queue.constants.ts
        ├── queue.module.ts
        ├── ingestion.processor.ts
        └── ingestion.scheduler.ts
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
git clone https://github.com/seifbenkarim10/job-platform.git
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

Edit `.env` with your values:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/job-platform
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Start infrastructure (MongoDB + Redis)

```bash
docker compose up -d
```

### 5. Run the application

```bash
# development
npm run start:dev

# production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api/v1`.

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

#### Query Parameters — `GET /api/v1/jobs`

| Parameter | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 100) |
| `search` | string | Full-text search on title + description |
| `location` | string | Filter by location |
| `isRemote` | boolean | Remote jobs only |
| `type` | string | `full-time`, `part-time`, `contract`, `freelance`, `internship` |
| `experienceLevel` | string | `junior`, `mid`, `senior`, `lead` |
| `salaryMin` | number | Minimum salary |
| `salaryMax` | number | Maximum salary |

#### Example

```bash
# Remote senior full-time jobs with salary above $100k
curl "http://localhost:3000/api/v1/jobs?isRemote=true&experienceLevel=senior&type=full-time&salaryMin=100000"
```

#### Paginated Response

```json
{
  "data": [...],
  "meta": {
    "total": 318,
    "page": 1,
    "limit": 20,
    "totalPages": 16,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Companies

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/companies` | List all companies |
| `GET` | `/api/v1/companies/:id` | Get single company |
| `POST` | `/api/v1/companies` | Create a company |

### Ingestion

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/ingestion/run` | Queue full ingestion (all sources) |
| `POST` | `/api/v1/ingestion/run/:source` | Queue ingestion for a specific source |
| `GET` | `/api/v1/ingestion/status` | Get queue status |

#### Sources

| Key | Source |
|---|---|
| `remotive` | Remotive.com |
| `arbeitnow` | Arbeitnow.com |
| `remoteok` | RemoteOK.com |
| `wwr` | WeWorkRemotely.com |

```bash
# Trigger full ingestion
curl -X POST http://localhost:3000/api/v1/ingestion/run

# Trigger single source
curl -X POST http://localhost:3000/api/v1/ingestion/run/remotive

# Check queue status
curl http://localhost:3000/api/v1/ingestion/status
```

---

## 📊 Queue Dashboard

Bull Board is available at:

```
http://localhost:3000/queues
```

Monitor waiting, active, completed, and failed jobs in real time. Retry failed jobs directly from the UI.

---

## ⏱ Ingestion Schedule

| Source | Frequency |
|---|---|
| All sources | Every 6 hours |
| Remotive | Every 2 hours (on the hour) |
| RemoteOK | Every 2 hours (+15 min offset) |
| Arbeitnow | Every 2 hours (+30 min offset) |
| WeWorkRemotely | Every 2 hours (+45 min offset) |

Sources are staggered to avoid hitting APIs simultaneously.

---

## 🗄 Data Model

### Job

```typescript
{
  title: string
  description: string
  company: ObjectId        // ref: Company
  source: ObjectId         // ref: Source
  skills: ObjectId[]       // ref: Skill
  location: string
  isRemote: boolean
  type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship'
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead'
  salaryMin: number
  salaryMax: number
  salaryCurrency: string
  applyUrl: string
  externalId: string       // for deduplication
  isActive: boolean
  postedAt: Date
  expiresAt: Date
}
```

---

## 🔄 Ingestion Pipeline

```
Cron Scheduler
      ↓
Bull Queue (Redis)
      ↓
Ingestion Processor
      ↓
Provider (Remotive / Arbeitnow / RemoteOK / WWR)
      ↓
Normalizer (maps to unified NormalizedJob format)
      ↓
Company resolution (findOrCreate)
      ↓
Skill resolution (findOrCreate per tag)
      ↓
MongoDB upsert (deduplicated by externalId + source)
```

---

## 🧪 Development Scripts

```bash
npm run start:dev      # start with hot reload
npm run build          # compile TypeScript
npm run start:prod     # run compiled build
npm run lint           # run ESLint
npm run test           # run unit tests
npm run test:e2e       # run e2e tests
```

---

## 📌 Roadmap

- [x] Week 1 — Project setup + architecture
- [x] Week 2 — Database schemas + core REST API
- [x] Week 3 — Multi-source data ingestion pipeline
- [x] Week 4 — Async queue system + cron scheduler
- [ ] Week 5 — Advanced search + Meilisearch integration
- [ ] Week 6 — Redis caching + rate limiting + performance
- [ ] Week 7 — Authentication + user accounts
- [ ] Week 8 — Next.js frontend
- [ ] Week 9 — Deployment + DevOps

---

## 📄 License

MIT