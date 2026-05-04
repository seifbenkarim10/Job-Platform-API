import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { IngestionService } from '../ingestion/ingestion.service';
import { INGESTION_QUEUE, IngestionJob } from './queue.constants';

export interface RunSourcePayload {
  source: string;
}

@Processor(INGESTION_QUEUE)
export class IngestionProcessor {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(private ingestionService: IngestionService) {}

  @Process(IngestionJob.RUN_ALL)
  async handleRunAll(job: Job) {
    this.logger.log(`Processing job ${job.id}: run-all`);
    const results = await this.ingestionService.runAll();
    this.logger.log(`run-all complete: ${JSON.stringify(results)}`);
    return results;
  }

  @Process(IngestionJob.RUN_SOURCE)
  async handleRunSource(job: Job<RunSourcePayload>) {
    const { source } = job.data;
    this.logger.log(`Processing job ${job.id}: run-source (${source})`);

    const sourceMap: Record<string, () => Promise<any>> = {
      Remotive: () =>
        this.ingestionService.runSource('Remotive', () =>
          this.ingestionService['remotive'].fetch(),
        ),
      Arbeitnow: () =>
        this.ingestionService.runSource('Arbeitnow', () =>
          this.ingestionService['arbeitnow'].fetch(),
        ),
      RemoteOK: () =>
        this.ingestionService.runSource('RemoteOK', () =>
          this.ingestionService['remoteok'].fetch(),
        ),
      WeWorkRemotely: () =>
        this.ingestionService.runSource('WeWorkRemotely', () =>
          this.ingestionService['wwr'].fetch(),
        ),
    };

    const runner = sourceMap[source];
    if (!runner) {
      this.logger.warn(`Unknown source: ${source}`);
      return;
    }

    const result = await runner();
    this.logger.log(
      `run-source (${source}) complete: ${JSON.stringify(result)}`,
    );
    return result;
  }
}
