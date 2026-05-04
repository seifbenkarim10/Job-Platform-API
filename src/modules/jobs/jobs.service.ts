import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from './schemas/job.schema';
import { FilterJobsDto } from './dto/filter-jobs.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CompaniesService } from '../companies/companies.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    private companiesService: CompaniesService,
  ) {}

  async findAll(filters: FilterJobsDto): Promise<PaginatedResult<Job>> {
    const query: Record<string, any> = { isActive: true };

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    if (filters.location) {
      query.location = { $regex: filters.location, $options: 'i' };
    }

    if (filters.isRemote !== undefined) {
      query.isRemote = filters.isRemote;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.experienceLevel) {
      query.experienceLevel = filters.experienceLevel;
    }

    if (filters.salaryMin !== undefined) {
      query.salaryMax = { $gte: filters.salaryMin };
    }

    if (filters.salaryMax !== undefined) {
      query.salaryMin = { $lte: filters.salaryMax };
    }

    const [data, total] = await Promise.all([
      this.jobModel
        .find(query)
        .populate('company', 'name logo location website')
        .populate('skills', 'name category')
        .populate('source', 'name url')
        .sort({ postedAt: -1 })
        .skip(filters.skip)
        .limit(filters.limit)
        .lean(),
      this.jobModel.countDocuments(query),
    ]);

    return {
      data,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
        hasNextPage: filters.page < Math.ceil(total / filters.limit),
        hasPrevPage: filters.page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Job> {
    const job = await this.jobModel
      .findById(id)
      .populate('company', 'name logo location website description')
      .populate('skills', 'name category')
      .populate('source', 'name url')
      .lean();

    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  async create(dto: CreateJobDto): Promise<Job> {
    let companyId = dto.company;

    // If it's not a valid ObjectId, treat it as a company name
    if (!dto.company.match(/^[a-f\d]{24}$/i)) {
      const company = await this.companiesService.findOrCreate(dto.company);
      companyId = company._id.toString();
    }
    const job = new this.jobModel({ ...dto, company: companyId });
    return job.save();
  }

  async deactivate(id: string): Promise<void> {
    await this.jobModel.findByIdAndUpdate(id, { isActive: false });
  }
}
