import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request & { method?: string; originalUrl?: string; url?: string }>();
    const response = httpContext.getResponse<{ statusCode?: number }>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.info({
          method: request.method,
          url: request.originalUrl ?? request.url,
          statusCode: response.statusCode,
          duration: Date.now() - startedAt,
        });
      }),
    );
  }
}
