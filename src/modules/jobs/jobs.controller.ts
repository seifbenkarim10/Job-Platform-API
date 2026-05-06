import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { FilterJobsDto } from './dto/filter-jobs.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600)
  findAll(@Query() filters: FilterJobsDto) {
    return this.jobsService.findAll(filters);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600)
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateJobDto) {
    return this.jobsService.create(dto);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.jobsService.deactivate(id);
  }
}
