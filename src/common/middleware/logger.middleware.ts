import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      const color =
        statusCode >= 500
          ? '🔴'
          : statusCode >= 400
            ? '🟡'
            : statusCode >= 300
              ? '🔵'
              : '🟢';

      this.logger.log(
        `${color} ${method} ${originalUrl} ${statusCode} - ${duration}ms - ${ip}`,
      );
    });

    next();
  }
}
