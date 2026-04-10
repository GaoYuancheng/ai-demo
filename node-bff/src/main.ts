import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { LoggerService } from './common/services/logger.service';
import { AuthInterceptor } from './common/interceptors/auth.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

/**
 * 应用启动函数
 */
async function bootstrap() {
  const app = await NestFactory.create(AiModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerService);

  app.useLogger(logger);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 注册全局异常过滤器
  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  // 注册全局拦截器
  app.useGlobalInterceptors(new AuthInterceptor(), new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`应用启动成功，监听端口: ${port}`);
  logger.log(`环境: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
