import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GetUserInfoTool } from './services/get-user-info.tool';
import { GetOrderListTool } from './services/get-order-list.tool';

/**
 * 工具模块
 * 负责所有Tool的注册、管理
 */
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    GetUserInfoTool,
    GetOrderListTool,
  ],
  exports: [
    GetUserInfoTool,
    GetOrderListTool,
  ],
})
export class ToolsModule {}