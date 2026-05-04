import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { NormalizedJob } from '../normalizers/job.normalizer';

@Injectable()
export class ArbeitnowProvider {
  private readonly logger = new Logger(ArbeitnowProvider.name);
  private readonly baseUrl = 'https://www.arbeitnow.com/api/job-board-api';

  constructor(private http: HttpService) {}

  async fetch(page = 1): Promise<NormalizedJob[]> {
    try {
      this.logger.log(`Fetching jobs from Arbeitnow (page ${page})`);
      const { data } = await firstValueFrom(
        this.http.get(this.baseUrl, { params: { page } }),
      );

      return data.data.map((job: any) => this.normalize(job));
    } catch (err: any) {
      this.logger.error('Arbeitnow fetch failed', err?.message);
      return [];
    }
  }

  private normalize(job: any): NormalizedJob {
    return {
      title: job.title,
      description: job.description,
      companyName: job.company_name,
      location: job.location,
      isRemote: job.remote ?? false,
      type: 'full-time',
      applyUrl: job.url,
      externalId: job.slug,
      sourceName: 'Arbeitnow',
      postedAt: new Date(job.created_at * 1000),
      skills: job.tags ?? [],
    };
  }
}
