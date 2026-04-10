import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../common/services/logger.service';
import { UserInfoWithOrderSkill } from '../../skills/services/user-info-with-order.skill';

/**
 * AI聊天处理服务
 * 负责在AI聊天接口转发过程中，解析请求/响应，触发Skills/Tools调用，整合执行结果
 */
@Injectable()
export class ChatProcessService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly userInfoWithOrderSkill: UserInfoWithOrderSkill,
  ) {
    this.loggerService.setContext('ChatProcessService');
  }

  /**
   * 处理聊天请求
   * 解析消息内容，判断是否需要调用Skills/Tools
   * @param message 聊天消息
   * @param sessionId 会话ID
   * @returns 处理后的消息
   */
  async processChatRequest(message: string, sessionId: string): Promise<string> {
    this.loggerService.info(`处理聊天请求，sessionId: ${sessionId}, message: ${message}`);

    const lowerMessage = message.toLowerCase();

    if (this.shouldCallSkill(lowerMessage)) {
      const skillResult = await this.callSkill(message, sessionId);
      return this.enhanceMessageWithSkillResult(message, skillResult);
    }

    return message;
  }

  /**
   * 判断是否需要调用Skill
   * @param message 消息内容
   * @returns 是否需要调用
   */
  private shouldCallSkill(message: string): boolean {
    const keywords = ['用户信息', '订单', '查询', '我的'];
    return keywords.some(keyword => message.includes(keyword));
  }

  /**
   * 调用Skill
   * @param message 原始消息
   * @param sessionId 会话ID
   * @returns Skill执行结果
   */
  private async callSkill(message: string, sessionId: string): Promise<any> {
    this.loggerService.info(`调用Skill，sessionId: ${sessionId}`);

    try {
      const result = await this.userInfoWithOrderSkill.execute({
        userId: '1',
        page: 1,
        pageSize: 10,
      });

      this.loggerService.info(`Skill执行成功，sessionId: ${sessionId}`);
      return result;
    } catch (error) {
      this.loggerService.error(`Skill执行失败，sessionId: ${sessionId}, 错误: ${error.message}`);
      throw error;
    }
  }

  /**
   * 将Skill执行结果增强到消息中
   * @param originalMessage 原始消息
   * @param skillResult Skill执行结果
   * @returns 增强后的消息
   */
  private enhanceMessageWithSkillResult(originalMessage: string, skillResult: any): string {
    const enhancedMessage =
      `${originalMessage}\n\n【系统提示】已为您查询到相关信息：\n` +
      `用户：${skillResult.userInfo.name}\n` +
      `邮箱：${skillResult.userInfo.email}\n` +
      `订单总数：${skillResult.total}\n` +
      `最近订单：${skillResult.orderList.length > 0 ? skillResult.orderList[0].orderNo : '无'}`;

    return enhancedMessage;
  }

  /**
   * 处理聊天响应
   * 解析后端返回的响应，判断是否包含工具调用指令
   * @param response 后端响应
   * @param sessionId 会话ID
   * @returns 处理后的响应
   */
  async processChatResponse(response: any, sessionId: string): Promise<any> {
    this.loggerService.info(`处理聊天响应，sessionId: ${sessionId}`);

    if (response.toolCalls && response.toolCalls.length > 0) {
      this.loggerService.info(`检测到工具调用指令，sessionId: ${sessionId}`);

      for (const toolCall of response.toolCalls) {
        const toolResult = await this.executeToolCall(toolCall, sessionId);
        response.toolResults = response.toolResults || [];
        response.toolResults.push(toolResult);
      }
    }

    return response;
  }

  /**
   * 执行工具调用
   * @param toolCall 工具调用指令
   * @param sessionId 会话ID
   * @returns 工具执行结果
   */
  private async executeToolCall(toolCall: any, sessionId: string): Promise<any> {
    this.loggerService.info(`执行工具调用，toolName: ${toolCall.name}, sessionId: ${sessionId}`);

    try {
      let result;
      switch (toolCall.name) {
        case 'getUserInfo':
          result = { userId: '1', name: '张三', email: 'zhangsan@example.com' };
          break;
        case 'getOrderList':
          result = { orderList: [], total: 0, page: 1, pageSize: 10 };
          break;
        default:
          result = { error: '未知的工具' };
      }

      this.loggerService.info(`工具执行成功，toolName: ${toolCall.name}, sessionId: ${sessionId}`);
      return result;
    } catch (error) {
      this.loggerService.error(
        `工具执行失败，toolName: ${toolCall.name}, sessionId: ${sessionId}, 错误: ${error.message}`,
      );
      return { error: error.message };
    }
  }
}
