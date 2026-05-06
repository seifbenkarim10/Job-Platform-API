import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meilisearch } from 'meilisearch';
import { SearchJobsDto } from './dto/search-jobs.dto';

export interface JobDocument {
  id: string;
  title: string;
  description: string;
  companyName: string;
  companyLogo?: string;
  location?: string;
  isRemote: boolean;
  type: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  applyUrl?: string;
  skills: string[];
  sourceName: string;
  postedAt: string;
  isActive: boolean;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: Meilisearch;
  private readonly indexName = 'jobs';

  constructor(private config: ConfigService) {
    this.client = new Meilisearch({
      host: this.config.get<string>('meilisearch.host')!,
      apiKey: this.config.get<string>('meilisearch.apiKey'),
    });
  }

  async onModuleInit() {
    await this.setupIndex();
  }

  private async setupIndex() {
    try {
      const index = this.client.index(this.indexName);

      // configure searchable attributes
      await index.updateSearchableAttributes([
        'title',
        'description',
        'companyName',
        'skills',
        'location',
      ]);

      // configure filterable attributes
      await index.updateFilterableAttributes([
        'isRemote',
        'type',
        'experienceLevel',
        'salaryMin',
        'salaryMax',
        'skills',
        'companyName',
        'location',
        'isActive',
      ]);

      // configure sortable attributes
      await index.updateSortableAttributes([
        'postedAt',
        'salaryMin',
        'salaryMax',
      ]);

      // ranking rules
      await index.updateRankingRules([
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ]);

      this.logger.log('Meilisearch index configured');
    } catch (err: any) {
      this.logger.error('Meilisearch setup failed', err?.message);
    }
  }

  async indexJobs(jobs: JobDocument[]) {
    if (!jobs.length) return;
    try {
      const index = this.client.index(this.indexName);
      await index.addDocuments(jobs, { primaryKey: 'id' });
      this.logger.log(`Indexed ${jobs.length} jobs in Meilisearch`);
    } catch (err: any) {
      this.logger.error('Meilisearch indexing failed', err?.message);
    }
  }

  async search(dto: SearchJobsDto) {
    const index = this.client.index(this.indexName);

    // build filters
    const filters: string[] = ['isActive = true'];

    if (dto.isRemote !== undefined) {
      filters.push(`isRemote = ${dto.isRemote}`);
    }

    if (dto.type) {
      filters.push(`type = "${dto.type}"`);
    }

    if (dto.experienceLevel) {
      filters.push(`experienceLevel = "${dto.experienceLevel}"`);
    }

    if (dto.salaryMin !== undefined) {
      filters.push(`salaryMax >= ${dto.salaryMin}`);
    }

    if (dto.salaryMax !== undefined) {
      filters.push(`salaryMin <= ${dto.salaryMax}`);
    }

    if (dto.location) {
      filters.push(`location = "${dto.location}"`);
    }

    if (dto.company) {
      filters.push(`companyName = "${dto.company}"`);
    }

    if (dto.skills) {
      const skillList = dto.skills.split(',').map((s) => s.trim());
      const skillFilters = skillList.map((s) => `skills = "${s}"`).join(' OR ');
      filters.push(`(${skillFilters})`);
    }

    const result = await index.search(dto.q ?? '', {
      filter: filters.join(' AND '),
      limit: dto.limit,
      offset: dto.skip,
      sort: ['postedAt:desc'],
      attributesToHighlight: ['title', 'description'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    });

    return {
      data: result.hits,
      meta: {
        total: result.estimatedTotalHits ?? 0,
        page: dto.page,
        limit: dto.limit,
        totalPages: Math.ceil((result.estimatedTotalHits ?? 0) / dto.limit),
        hasNextPage: dto.skip + dto.limit < (result.estimatedTotalHits ?? 0),
        hasPrevPage: dto.page > 1,
        query: dto.q,
        processingTimeMs: result.processingTimeMs,
      },
    };
  }

  async deleteJob(id: string) {
    try {
      await this.client.index(this.indexName).deleteDocument(id);
    } catch (err: any) {
      this.logger.error(
        `Failed to delete job ${id} from Meilisearch`,
        err?.message,
      );
    }
  }

  async clearIndex() {
    await this.client.index(this.indexName).deleteAllDocuments();
    this.logger.log('Meilisearch index cleared');
  }
}
