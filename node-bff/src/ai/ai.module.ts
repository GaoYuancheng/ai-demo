import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';
import { ApiProxyModule } from './api-proxy/api-proxy.module';
import { ChatProcessModule } from './chat-process/chat-process.module';
import { AuthController } from './controllers/auth.controller';
import { AiController } from './controllers/ai.controller';
import { FileController } from './controllers/file.controller';
import { UserController } from './controllers/user.controller';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';

/**
 * AI主模块
 * 统一管理所有子模块、服务、接口
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CommonModule,
    ApiProxyModule,
    ChatProcessModule,
  ],
  controllers: [AuthController, AiController, FileController, UserController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AiModule {}
