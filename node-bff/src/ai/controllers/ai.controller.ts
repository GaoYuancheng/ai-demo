import { Controller, Post, Get, Delete, Body, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiProxyService } from '../api-proxy/services/api-proxy.service';
import { ChatProcessService } from '../chat-process/services/chat-process.service';

/**
 * AI控制器
 * 负责处理AI聊天、会话管理等接口
 */
@Controller('ai')
export class AiController {
  constructor(
    private readonly apiProxyService: ApiProxyService,
    private readonly chatProcessService: ChatProcessService,
  ) {}

  /**
   * 发送聊天消息（核心，集成Skills/Tools调用）
   */
  @Post('chat')
  async chat(@Body() chatData: any, @Res() response: Response) {
    const { sessionId, message, stream } = chatData;

    const processedMessage = await this.chatProcessService.processChatRequest(message, sessionId);

    const enhancedChatData = {
      ...chatData,
      message: processedMessage,
    };

    if (stream) {
      // 流式响应处理
      await this.apiProxyService.aiChat(enhancedChatData, response);
    } else {
      // 非流式响应处理
      const apiResponse = await this.apiProxyService.aiChat(enhancedChatData, null);
      const processedResponse = await this.chatProcessService.processChatResponse(
        apiResponse,
        sessionId,
      );
      response.json(processedResponse);
    }
  }

  /**
   * 创建会话
   */
  @Post('session/create')
  async createSession(@Body() sessionData: any) {
    return this.apiProxyService.createAiSession(sessionData);
  }

  /**
   * 获取会话列表
   */
  @Get('session/list')
  async getSessionList() {
    return this.apiProxyService.getAiSessions();
  }

  /**
   * 获取聊天历史
   */
  @Get('chat/history')
  async getChatHistory(@Query('sessionId') sessionId: string) {
    return this.apiProxyService.getAiChatHistory({ sessionId });
  }

  /**
   * 删除会话
   */
  @Delete('session/:sessionId')
  async deleteSession(@Param('sessionId') sessionId: string) {
    return this.apiProxyService.deleteAiSession(sessionId);
  }

  /**
   * 获取AI配置
   */
  @Get('config')
  async getConfig() {
    return this.apiProxyService.getAiConfig();
  }
}
