import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

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

      response.status(status).json({
        success: false,
        data: null,
        message: Array.isArray(message) ? message.join('; ') : message,
        code,
      });
    } else {
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        data: null,
        message: '服务器内部错误',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  }
}
