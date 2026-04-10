import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ApiProxyService } from './services/api-proxy.service';

/**
 * 接口代理模块
 * 负责所有接口的转发逻辑
 */
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [ApiProxyService],
  exports: [ApiProxyService],
})
export class ApiProxyModule {}