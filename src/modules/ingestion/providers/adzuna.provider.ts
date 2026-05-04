import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { NormalizedJob } from '../normalizers/job.normalizer';

@Injectable()
export class AdzunaProvider {
  private readonly logger = new Logger(AdzunaProvider.name);
  private readonly baseUrl = 'https://api.adzuna.com/v1/api/jobs';

  constructor(
    private http: HttpService,
    private config: ConfigService,
  ) {}

  async fetch(
    country = 'us',
    query = 'software engineer',
    page = 1,
  ): Promise<NormalizedJob[]> {
    const appId = this.config.get('ADZUNA_APP_ID');
    const appKey = this.config.get('ADZUNA_APP_KEY');
    this.logger.warn(`cred ${appKey}, ${appId}`);

    if (!appId || !appKey) {
      this.logger.warn('Adzuna credentials not set, skipping');
      return [];
    }

    try {
      this.logger.log(`Fetching jobs from Adzuna (${country}, page ${page})`);
      const url = `${this.baseUrl}/${country}/search/${page}`;
      const { data } = await firstValueFrom(
        this.http.get(url, {
          auth: {
            username: appId,
            password: appKey,
          },
          params: {
            what: query,
            results_per_page: 50,
          },
        }),
      );

      return data.results.map((job: any) => this.normalize(job));
    } catch (err) {
      this.logger.error('Adzuna fetch failed', err?.message);
      return [];
    }
  }

  private normalize(job: any): NormalizedJob {
    const [salaryMin, salaryMax] = this.extractSalary(job);
    return {
      title: job.title,
      description: job.description,
      companyName: job.company?.display_name ?? 'Unknown',
      location: job.location?.display_name,
      isRemote: job.title?.toLowerCase().includes('remote') || false,
      type: 'full-time',
      salaryMin,
      salaryMax,
      salaryCurrency: 'USD',
      applyUrl: job.redirect_url,
      externalId: job.id,
      sourceName: 'Adzuna',
      postedAt: new Date(job.created),
    };
  }

  private extractSalary(job: any): [number?, number?] {
    if (job.salary_min && job.salary_max) {
      return [Math.round(job.salary_min), Math.round(job.salary_max)];
    }
    return [undefined, undefined];
  }
}
