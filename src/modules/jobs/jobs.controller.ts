import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Delete,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { FilterJobsDto } from './dto/filter-jobs.dto';
import { CreateJobDto } from './dto/create-job.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  findAll(@Query() filters: FilterJobsDto) {
    return this.jobsService.findAll(filters);
  }

  @Get(':id')
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
