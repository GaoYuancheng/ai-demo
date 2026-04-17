import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../common/services/logger.service';

/**
 * AI聊天处理服务
 * 负责在AI聊天接口转发过程中，执行Tools调用
 */
@Injectable()
export class ChatProcessService {
  constructor(private readonly loggerService: LoggerService) {
    this.loggerService.setContext('ChatProcessService');
  }

  /**
   * 获取工具列表
   * @returns 工具列表
   */
  async getTools(): Promise<any[]> {
    return [
      {
        type: 'function',
        function: {
          name: 'get_current_weather',
          description: '当你想查询指定城市的天气时非常有用。',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: '城市或县区，比如北京市、杭州市、余杭区等。',
              },
            },
            required: ['location'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_current_time',
          description: '当你想查询当前时间时非常有用。',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      },
    ];
  }

  /**
   * 执行工具调用
   * @param toolCalls 工具调用指令列表
   * @param sessionId 会话ID
   * @returns 工具执行结果列表
   */
  async executeToolCalls(toolCalls: any[], sessionId: string): Promise<any[]> {
    this.loggerService.info(
      `执行工具调用，toolCount: ${toolCalls.length}, sessionId: ${sessionId}`,
    );

    const toolResults = [];

    for (const toolCall of toolCalls) {
      this.loggerService.info(
        `执行工具调用，toolName: ${toolCall.function.name}, sessionId: ${sessionId}`,
      );

      try {
        let result;
        switch (toolCall.function.name) {
          case 'get_current_weather':
            const location = JSON.parse(toolCall.function.arguments).location;
            result = this.get_current_weather(location);
            break;
          case 'get_current_time':
            result = this.get_current_time();
            break;
          default:
            result = { error: '未知的工具' };
        }

        this.loggerService.info(
          `工具执行成功，toolName: ${toolCall.function.name}, sessionId: ${sessionId}`,
        );

        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: JSON.stringify(result),
        });
      } catch (error) {
        this.loggerService.error(
          `工具执行失败，toolName: ${toolCall.function.name}, sessionId: ${sessionId}, 错误: ${error.message}`,
        );
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: JSON.stringify({ error: error.message }),
        });
      }
    }

    return toolResults;
  }

  /**
   * 天气查询工具
   * 模拟查询指定城市的天气
   * @param location 城市名称
   * @returns 天气信息
   */
  private get_current_weather(location: string): string {
    // 模拟天气数据
    const weatherConditions = ['晴天', '多云', '雨天', '阴天', '雪天'];
    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    return `${location}今天是${randomWeather}。`;
  }

  /**
   * 时间查询工具
   * 查询当前时间
   * @returns 当前时间信息
   */
  private get_current_time(): string {
    const now = new Date();
    return `当前时间是${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}。`;
  }
}
