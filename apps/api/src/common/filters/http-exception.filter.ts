import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger?: PinoLogger) {
    this.logger?.setContext(HttpExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request =
      'getRequest' in ctx
        ? ctx.getRequest<Request & { method?: string; originalUrl?: string; url?: string }>()
        : undefined;
    const requestMethod = request?.method;
    const requestUrl = request?.originalUrl ?? request?.url;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'object' && 'message' in exceptionResponse
          ? (exceptionResponse as any).message
          : exception.message;
      const code =
        typeof exceptionResponse === 'object' && 'code' in exceptionResponse
          ? (exceptionResponse as any).code
          : 'HTTP_ERROR';

      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger?.error({
          err: exception,
          method: requestMethod,
          url: requestUrl,
          statusCode: status,
          code,
        });
      }

      response.status(status).json({
        success: false,
        data: null,
        message: Array.isArray(message) ? message.join('; ') : message,
        code,
      });
    } else {
      this.logger?.error({
        err: exception,
        method: requestMethod,
        url: requestUrl,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        data: null,
        message: '服务器内部错误',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  }
}
