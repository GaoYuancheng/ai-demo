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
 * 统一处理所有异常，返回标准化错误响应并记录详细日志
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

    const { method, url, ip, headers, body, query } = request;

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

    const requestInfo = {
      method,
      url,
      ip: ip || headers['x-forwarded-for'] || headers['remote-addr'],
      userAgent: headers['user-agent'],
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof BusinessException) {
      this.logger.error(
        `业务异常 [${method} ${url}]: ${message}`,
        exception.stack,
      );
      this.logger.debug(`请求详情: ${JSON.stringify(requestInfo)}`);
    } else {
      this.logger.error(
        `未处理的异常 [${method} ${url}]: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
      this.logger.debug(`请求详情: ${JSON.stringify(requestInfo)}`);
    }

    response.status(status).json({
      code,
      message,
      data,
      timestamp: new Date().toISOString(),
      path: url,
      requestId: headers['x-request-id'] || this.generateRequestId(),
    });
  }

  /**
   * 生成请求ID用于追踪
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}