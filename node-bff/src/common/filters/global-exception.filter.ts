import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';
import { BusinessException } from '../exceptions/business.exception';

/**
 * 全局异常过滤器
 * 统一处理所有异常，返回标准化错误响应
 */
@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('GlobalExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let code = status;
    let data = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        if (Array.isArray(responseObj.message)) {
          message = responseObj.message.join(', ');
        }
        code = responseObj.code || status;
        data = responseObj.data || null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (exception instanceof BusinessException) {
      this.logger.error(
        `业务异常: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `未处理的异常: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      code,
      message,
      data,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}