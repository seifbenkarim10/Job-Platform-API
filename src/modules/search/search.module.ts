import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from '../jobs/schemas/job.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }])],
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}
