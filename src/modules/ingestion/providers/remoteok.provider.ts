import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { NormalizedJob } from '../normalizers/job.normalizer';

@Injectable()
export class RemoteOkProvider {
  private readonly logger = new Logger(RemoteOkProvider.name);
  private readonly baseUrl = 'https://remoteok.com/api';

  constructor(private http: HttpService) {}

  async fetch(): Promise<NormalizedJob[]> {
    try {
      this.logger.log('Fetching jobs from RemoteOK');
      const { data } = await firstValueFrom(
        this.http.get(this.baseUrl, {
          headers: { 'User-Agent': 'job-platform-bot/1.0' },
        }),
      );

      // first item is a legal notice, skip it
      const jobs = data.slice(1);
      return jobs.map((job: any) => this.normalize(job));
    } catch (err: any) {
      this.logger.error('RemoteOK fetch failed', err?.message);
      return [];
    }
  }

  private normalize(job: any): NormalizedJob {
    return {
      title: job.position,
      description: job.description ?? '',
      companyName: job.company,
      companyLogo: job.company_logo,
      location: 'Remote',
      isRemote: true,
      type: 'full-time',
      applyUrl: job.url,
      externalId: String(job.id),
      sourceName: 'RemoteOK',
      postedAt: new Date(job.date),
      skills: job.tags ?? [],
    };
  }
}
