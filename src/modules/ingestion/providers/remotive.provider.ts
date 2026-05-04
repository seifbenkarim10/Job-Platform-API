import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { NormalizedJob } from '../normalizers/job.normalizer';

@Injectable()
export class RemotiveProvider {
  private readonly logger = new Logger(RemotiveProvider.name);
  private readonly baseUrl = 'https://remotive.com/api/remote-jobs';

  constructor(private http: HttpService) {}

  async fetch(category = 'software-dev', limit = 50): Promise<NormalizedJob[]> {
    try {
      this.logger.log(`Fetching jobs from Remotive (category: ${category})`);
      const { data } = await firstValueFrom(
        this.http.get(this.baseUrl, {
          params: { category, limit },
        }),
      );

      return data.jobs.map((job: any) => this.normalize(job));
    } catch (err) {
      this.logger.error('Remotive fetch failed', err?.message);
      return [];
    }
  }

  private normalize(job: any): NormalizedJob {
    return {
      title: job.title,
      description: job.description,
      companyName: job.company_name,
      companyLogo: job.company_logo_url,
      location: job.candidate_required_location || 'Worldwide',
      isRemote: true,
      type: this.mapType(job.job_type),
      applyUrl: job.url,
      externalId: String(job.id),
      sourceName: 'Remotive',
      postedAt: new Date(job.publication_date),
      skills: job.tags ?? [],
    };
  }

  private mapType(type: string): string {
    const map: Record<string, string> = {
      full_time: 'full-time',
      part_time: 'part-time',
      contract: 'contract',
      freelance: 'freelance',
      internship: 'internship',
    };
    return map[type] ?? 'full-time';
  }
}
