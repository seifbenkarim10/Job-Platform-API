import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from '../jobs/schemas/job.schema';
import { Source, SourceSchema } from '../sources/schemas/source.schema';
import { CompaniesModule } from '../companies/companies.module';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { RemotiveProvider } from './providers/remotive.provider';
import { AdzunaProvider } from './providers/adzuna.provider';
import { WeWorkRemotelyScraper } from './providers/weworkremotely.scraper';
import { SkillsModule } from '../skills/skills.module';
import { ArbeitnowProvider } from './providers/arbeitnow.provider';
import { RemoteOkProvider } from './providers/remoteok.provider';
import { BullModule } from '@nestjs/bull';
import { INGESTION_QUEUE } from '../queue/queue.constants';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({ name: INGESTION_QUEUE }),
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: Source.name, schema: SourceSchema },
    ]),
    CompaniesModule,
    SkillsModule,
    SearchModule,
  ],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    RemotiveProvider,
    AdzunaProvider,
    WeWorkRemotelyScraper,
    ArbeitnowProvider,
    RemoteOkProvider,
  ],
  exports: [IngestionService],
})
export class IngestionModule {}
