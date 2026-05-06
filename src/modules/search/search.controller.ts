import { Controller, Get, Query, Post, UseInterceptors } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from '../jobs/schemas/job.schema';
import {
  SearchService,
  JobDocument as MeiliJobDocument,
} from './search.service';
import { SearchJobsDto } from './dto/search-jobs.dto';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
  ) {}

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(120)
  @Get('jobs')
  search(@Query() dto: SearchJobsDto) {
    return this.searchService.search(dto);
  }

  @Post('reindex')
  async reindex() {
    const jobs = await this.jobModel
      .find({ isActive: true })
      .populate('company', 'name logo')
      .populate('skills', 'name')
      .lean();

    const docs: MeiliJobDocument[] = jobs.map((job: any) => ({
      id: job._id.toString(),
      title: job.title,
      description: job.description,
      companyName: job.company?.name ?? '',
      companyLogo: job.company?.logo,
      location: job.location,
      isRemote: job.isRemote,
      type: job.type,
      experienceLevel: job.experienceLevel,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      applyUrl: job.applyUrl,
      skills: job.skills?.map((s: any) => s.name) ?? [],
      sourceName: job.source?.toString() ?? '',
      postedAt: job.postedAt?.toISOString() ?? new Date().toISOString(),
      isActive: job.isActive,
    }));

    await this.searchService.indexJobs(docs);
    return { message: `Reindexed ${docs.length} jobs` };
  }
}
