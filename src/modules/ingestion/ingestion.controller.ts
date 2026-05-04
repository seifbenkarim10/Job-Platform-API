import { Controller, Post, Get, Param } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { INGESTION_QUEUE, IngestionJob } from '../queue/queue.constants';

@Controller('ingestion')
export class IngestionController {
  constructor(@InjectQueue(INGESTION_QUEUE) private ingestionQueue: Queue) {}

  @Post('run')
  async runAll() {
    const job = await this.ingestionQueue.add(
      IngestionJob.RUN_ALL,
      {},
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        // remove removeOnComplete so jobs stay visible in dashboard
      },
    );
    return { message: 'Ingestion queued', jobId: job.id };
  }

  @Post('run/:source')
  async runOne(@Param('source') source: string) {
    const sourceMap: Record<string, string> = {
      remotive: 'Remotive',
      arbeitnow: 'Arbeitnow',
      remoteok: 'RemoteOK',
      wwr: 'WeWorkRemotely',
    };

    const sourceName = sourceMap[source.toLowerCase()];
    if (!sourceName) return { error: `Unknown source: ${source}` };

    const job = await this.ingestionQueue.add(
      IngestionJob.RUN_SOURCE,
      { source: sourceName },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        // remove removeOnComplete so jobs stay visible in dashboard
      },
    );
    return { message: `Ingestion queued for ${sourceName}`, jobId: job.id };
  }

  @Get('status')
  async getStatus() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.ingestionQueue.getWaitingCount(),
      this.ingestionQueue.getActiveCount(),
      this.ingestionQueue.getCompletedCount(),
      this.ingestionQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }
}
