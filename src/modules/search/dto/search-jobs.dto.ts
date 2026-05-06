import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JobType, ExperienceLevel } from '../../jobs/schemas/job.schema';

export class SearchJobsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  q?: string; // search query

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRemote?: boolean;

  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @IsString()
  skills?: string; // comma-separated e.g. "react,node"

  @IsOptional()
  @IsString()
  company?: string;
}
