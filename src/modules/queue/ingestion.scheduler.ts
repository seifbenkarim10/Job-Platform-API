import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { INGESTION_QUEUE, IngestionJob } from './queue.constants';

@Injectable()
export class IngestionScheduler {
  private readonly logger = new Logger(IngestionScheduler.name);

  constructor(@InjectQueue(INGESTION_QUEUE) private ingestionQueue: Queue) {}

  // runs every 6 hours
  @Cron(CronExpression.EVERY_6_HOURS)
  async scheduleFullIngestion() {
    this.logger.log('Scheduling full ingestion run');
    await this.ingestionQueue.add(
      IngestionJob.RUN_ALL,
      {},
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100, // keep last 100 completed jobs
        removeOnFail: 50,
      },
    );
  }

  // runs every 2 hours, staggers sources to avoid hammering APIs
  @Cron('0 */2 * * *')
  async scheduleRemotive() {
    await this.addSourceJob('Remotive');
  }

  @Cron('30 */2 * * *')
  async scheduleArbeitnow() {
    await this.addSourceJob('Arbeitnow');
  }

  @Cron('15 */2 * * *')
  async scheduleRemoteOK() {
    await this.addSourceJob('RemoteOK');
  }

  @Cron('45 */2 * * *')
  async scheduleWWR() {
    await this.addSourceJob('WeWorkRemotely');
  }

  private async addSourceJob(source: string) {
    this.logger.log(`Scheduling ingestion for: ${source}`);
    await this.ingestionQueue.add(
      IngestionJob.RUN_SOURCE,
      { source },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 25,
      },
    );
  }
}
