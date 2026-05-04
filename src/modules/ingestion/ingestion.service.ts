import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from '../jobs/schemas/job.schema';
import { Source, SourceDocument } from '../sources/schemas/source.schema';
import { CompaniesService } from '../companies/companies.service';
import { RemotiveProvider } from './providers/remotive.provider';
import { AdzunaProvider } from './providers/adzuna.provider';
import { WeWorkRemotelyScraper } from './providers/weworkremotely.scraper';
import { NormalizedJob } from './normalizers/job.normalizer';
import { SkillsService } from '../skills/skills.service';
import { RemoteOkProvider } from './providers/remoteok.provider';
import { ArbeitnowProvider } from './providers/arbeitnow.provider';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Source.name) private sourceModel: Model<SourceDocument>,
    private companiesService: CompaniesService,
    private skillsService: SkillsService,
    private remotive: RemotiveProvider,
    private adzuna: AdzunaProvider,
    private arbeitnow: ArbeitnowProvider,
    private remoteok: RemoteOkProvider,
    private wwr: WeWorkRemotelyScraper,
  ) {}

  async runAll(): Promise<
    { source: string; saved: number; skipped: number }[]
  > {
    const results = await Promise.allSettled([
      this.runSource('Remotive', () => this.remotive.fetch()),
      this.runSource('Adzuna', () => this.adzuna.fetch()),
      this.runSource('WeWorkRemotely', () => this.wwr.fetch()),
      this.runSource('Arbeitnow', () => this.arbeitnow.fetch()),
      this.runSource('RemoteOK', () => this.remoteok.fetch()),
    ]);

    return results
      .filter((r) => r.status === 'fulfilled')
      .map((r: any) => r.value);
  }

  async runSource(
    sourceName: string,
    fetcher: () => Promise<NormalizedJob[]>,
  ): Promise<{ source: string; saved: number; skipped: number }> {
    this.logger.log(`Starting ingestion: ${sourceName}`);

    const source = await this.sourceModel.findOneAndUpdate(
      { name: sourceName },
      { $setOnInsert: { name: sourceName, url: '', isActive: true } },
      { upsert: true, new: true },
    );

    const jobs = await fetcher();
    this.logger.log(`${sourceName}: fetched ${jobs.length} jobs`);

    let saved = 0;
    let skipped = 0;

    for (const normalized of jobs) {
      try {
        const company = await this.companiesService.findOrCreate(
          normalized.companyName,
          {
            website: normalized.companyWebsite,
            logo: normalized.companyLogo,
          },
        );

        const skillIds = await this.skillsService.resolveSkills(
          normalized.skills ?? [],
        );

        await this.jobModel.findOneAndUpdate(
          // deduplication key
          { externalId: normalized.externalId, source: source._id },
          {
            $setOnInsert: {
              title: normalized.title,
              description: normalized.description,
              company: company._id,
              source: source._id,
              skills: skillIds,
              location: normalized.location,
              isRemote: normalized.isRemote ?? false,
              type: normalized.type ?? 'full-time',
              experienceLevel: normalized.experienceLevel,
              salaryMin: normalized.salaryMin,
              salaryMax: normalized.salaryMax,
              salaryCurrency: normalized.salaryCurrency,
              applyUrl: normalized.applyUrl,
              externalId: normalized.externalId,
              postedAt: normalized.postedAt ?? new Date(),
              isActive: true,
            },
          },
          { upsert: true, new: true },
        );
        saved++;
      } catch (err) {
        if (err.code === 11000) {
          skipped++; // duplicate, expected
        } else {
          this.logger.error(
            `Failed to save job: ${normalized.title}`,
            err?.message,
          );
          skipped++;
        }
      }
    }

    await this.sourceModel.findByIdAndUpdate(source._id, {
      lastScrapedAt: new Date(),
    });
    this.logger.log(`${sourceName}: saved=${saved} skipped=${skipped}`);
    return { source: sourceName, saved, skipped };
  }
}
