import { Module } from '@nestjs/common';
import { SkillsModule } from '../skills/skills.module';
import { ChatProcessService } from './services/chat-process.service';

/**
 * AI聊天处理模块
 * 负责在AI聊天接口转发过程中，解析请求/响应，触发Skills/Tools调用，整合执行结果
 */
@Module({
  imports: [SkillsModule],
  providers: [ChatProcessService],
  exports: [ChatProcessService],
})
export class ChatProcessModule {}