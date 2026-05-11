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
      {
        type: 'function',
        function: {
          name: 'generate_chart',
          description:
            '当你需要绘制图表时使用此工具，把工具的原结果直接返回给用户即可，不需要额外处理。 ```chart``` 部分会自动渲染成图表。支持折线图、柱状图、饼图、散点图和面积图。',
          parameters: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: '图表标题，比如"销售数据分析"。',
              },
              type: {
                type: 'string',
                enum: ['line', 'bar', 'pie', 'scatter', 'area'],
                description:
                  '图表类型，可选值：line（折线图）、bar（柱状图）、pie（饼图）、scatter（散点图）、area（面积图）。',
              },
              xAxis: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'X轴数据数组，比如["1月", "2月", "3月"]。',
              },
              series: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: '系列名称。',
                    },
                    data: {
                      type: 'array',
                      items: {
                        type: 'number',
                      },
                      description: '数据数组。',
                    },
                  },
                },
                description: '系列数据数组，包含名称和对应的数据。',
              },
            },
            required: ['type', 'series'],
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
          case 'generate_chart':
            const chartArgs = JSON.parse(toolCall.function.arguments);
            result = this.generate_chart(chartArgs);
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

  /**
   * 图表生成工具
   * 根据用户请求生成图表配置，用于在前端渲染图表
   * @param args 图表参数，包含标题、类型、X轴数据和系列数据
   * @returns 图表配置对象的 Markdown 代码块格式
   */
  private generate_chart(args: {
    title?: string;
    type?: string;
    xAxis?: string[];
    series?: Array<{
      name?: string;
      data?: number[];
    }>;
  }): string {
    // 设置默认值
    const chartType = args.type || 'line';
    const chartTitle = args.title || '数据图表';
    const chartXAxis = args.xAxis || ['数据1', '数据2', '数据3', '数据4', '数据5'];

    // 如果没有提供系列数据，生成模拟数据
    let chartSeries = args.series;
    if (!chartSeries || chartSeries.length === 0) {
      chartSeries = [
        {
          name: '系列1',
          data: [65, 78, 90, 81, 95],
        },
      ];
    }

    // 构建图表配置
    const chartConfig = {
      title: chartTitle,
      xAxis: chartXAxis,
      series: chartSeries.map((s, index) => ({
        name: s.name || `系列${index + 1}`,
        type: chartType,
        data:
          s.data ||
          [
            Math.random() * 100,
            Math.random() * 100,
            Math.random() * 100,
            Math.random() * 100,
            Math.random() * 100,
          ].map(Math.round),
      })),
    };

    // 返回 Markdown 代码块格式，供前端渲染图表
    return `\`\`\`chart
${JSON.stringify(chartConfig, null, 2)}
\`\`\``;
  }
}
