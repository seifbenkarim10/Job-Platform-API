import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { XMLParser } from 'fast-xml-parser';
import { NormalizedJob } from '../normalizers/job.normalizer';

@Injectable()
export class WeWorkRemotelyScraper {
  private readonly logger = new Logger(WeWorkRemotelyScraper.name);
  private readonly feedUrl = 'https://weworkremotely.com/remote-jobs.rss';

  constructor(private http: HttpService) {}

  async fetch(): Promise<NormalizedJob[]> {
    this.logger.log('Fetching We Work Remotely RSS feed');
    try {
      const { data } = await firstValueFrom(
        this.http.get<string>(this.feedUrl, {
          headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
          responseType: 'text',
        }),
      );

      const parser = new XMLParser({ ignoreAttributes: false });
      const result = parser.parse(data);
      const items = result?.rss?.channel?.item ?? [];
      const list = Array.isArray(items) ? items : [items];

      return list.map((item: any, index: number) =>
        this.normalize(item, index),
      );
    } catch (err) {
      this.logger.error('WWR fetch failed', err?.message);
      return [];
    }
  }

  private normalize(item: any, index: number): NormalizedJob {
    const title: string = item.title ?? '';
    const parts = title.split(' at ');
    const jobTitle = parts[0]?.trim() ?? title;
    const companyName = parts[1]?.trim() ?? 'Unknown';

    return {
      title: jobTitle,
      description: item.description ?? '',
      companyName,
      location: 'Remote',
      isRemote: true,
      type: 'full-time',
      applyUrl: item.link ?? '',
      externalId:
        item.guid?.['#text'] ?? item.guid ?? `wwr-${index}-${Date.now()}`,
      sourceName: 'WeWorkRemotely',
      postedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
    };
  }
}
