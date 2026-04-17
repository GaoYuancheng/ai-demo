import { Module } from '@nestjs/common';
import { ChatProcessService } from './services/chat-process.service';

/**
 * AI聊天处理模块
 * 负责在AI聊天接口转发过程中，解析请求/响应，触发Skills/Tools调用，整合执行结果
 */
@Module({
  providers: [ChatProcessService],
  exports: [ChatProcessService],
})
export class ChatProcessModule {}