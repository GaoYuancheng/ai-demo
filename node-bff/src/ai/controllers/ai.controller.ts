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
   * 发送聊天消息（核心，集成Tools调用）
   * 按照文档要求：第一次非流式判断工具，第二次流式获取回答
   */
  @Post('chat')
  async chat(@Body() chatData: any, @Res() response: Response) {
    const { sessionId, message, stream } = chatData;

    // 获取工具列表
    const tools = await this.chatProcessService.getTools();

    // 第一步：第一次调用 Java（非流式，判断是否需要工具）
    const toolCheckData = {
      ...chatData,
      stream: false,
      tools,
    };

    const toolCheckResponse = await this.apiProxyService.checkTools(toolCheckData);

    if (!toolCheckResponse.needsTools) {
      // 不需要工具调用，直接返回内容
      response.json({
        content: toolCheckResponse.content,
        done: true,
      });
      return;
    }

    // 第二步：需要工具调用，执行 Mock 工具
    const toolResults = await this.chatProcessService.executeToolCalls(
      toolCheckResponse.toolCalls,
      sessionId,
    );

    // 第三步：第二次调用 Java（流式，获取最终回答）
    const streamData = {
      ...chatData,
      stream: true,
      tools,
      toolResults,
    };

    // 流式响应处理
    await this.apiProxyService.aiChat(streamData, response);
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
