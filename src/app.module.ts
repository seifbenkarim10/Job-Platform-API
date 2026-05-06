import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './common/health/health.controller';
import { JobsModule } from './modules/jobs/jobs.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { BullModule } from '@nestjs/bull';
import { QueueModule } from './modules/queue/queue.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { SearchModule } from './modules/search/search.module';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongodb.uri'),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
        },
      }),
    }),
    // Redis cache
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        host: config.get<string>('redis.host'),
        port: config.get<number>('redis.port'),
        ttl: 300, // 5 minutes default
      }),
    }),
    TerminusModule,
    JobsModule,
    CompaniesModule,
    IngestionModule,
    QueueModule,
    SearchModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
