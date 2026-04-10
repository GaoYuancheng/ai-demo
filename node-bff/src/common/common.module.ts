import { Module, Global } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { AsyncLocalStorageService } from './services/async-local-storage.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { AuthInterceptor } from './interceptors/auth.interceptor';

/**
 * 公共模块
 * 提供日志服务、异常过滤器、拦截器等通用功能
 */
@Global()
@Module({
  providers: [
    LoggerService,
    AsyncLocalStorageService,
    GlobalExceptionFilter,
    LoggingInterceptor,
    AuthInterceptor,
  ],
  exports: [
    LoggerService,
    AsyncLocalStorageService,
    GlobalExceptionFilter,
    LoggingInterceptor,
    AuthInterceptor,
  ],
})
export class CommonModule {}