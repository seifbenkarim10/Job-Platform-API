import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { INGESTION_QUEUE } from './queue.constants';
import { IngestionProcessor } from './ingestion.processor';
import { IngestionScheduler } from './ingestion.scheduler';
import { IngestionModule } from '../ingestion/ingestion.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: INGESTION_QUEUE }),
    IngestionModule,
  ],
  providers: [IngestionProcessor, IngestionScheduler],
})
export class QueueModule {}
