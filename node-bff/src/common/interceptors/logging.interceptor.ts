import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * 日志拦截器
 * 记录请求和响应信息
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, headers } = request;
    const startTime = Date.now();

    this.logger.log(`请求开始: ${method} ${url}`);

    return next.handle().pipe(
      tap(response => {
        const duration = Date.now() - startTime;
        this.logger.log(
          `请求成功: ${method} ${url} - 状态: ${response?.statusCode || 200} - 耗时: ${duration}ms`,
        );
      }),
    );
  }
}
