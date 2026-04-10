import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../common/services/logger.service';
import { GetOrderListInput } from '../dto/get-order-list.input';
import { GetOrderListOutput } from '../dto/get-order-list.output';
import { ToolExecutionException } from '../../../common/exceptions/business.exception';

/**
 * 获取订单列表工具
 * 示例工具，用于演示Tool的实现方式
 */
@Injectable()
export class GetOrderListTool {
  constructor(
    private readonly httpService: HttpService,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.loggerService.setContext('GetOrderListTool');
  }

  /**
   * 执行工具逻辑
   * @param input 输入参数
   * @returns 输出结果
   */
  async execute(input: GetOrderListInput): Promise<GetOrderListOutput> {
    try {
      this.loggerService.info(
        `GetOrderListTool执行，userId: ${input.userId}, page: ${input.page}, pageSize: ${input.pageSize}`,
      );
      
      const backendBaseUrl = this.configService.get<string>('BACKEND_BASE_URL');
      
      const response = await firstValueFrom(
        this.httpService.get(`${backendBaseUrl}/api/v1/orders`, {
          params: {
            userId: input.userId,
            page: input.page,
            pageSize: input.pageSize,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      if (!response.data || !response.data.success) {
        throw new Error('订单列表查询失败');
      }

      const result: GetOrderListOutput = {
        orderList: response.data.data.orderList || [],
        total: response.data.data.total || 0,
        page: input.page,
        pageSize: input.pageSize,
      };

      this.loggerService.info(`GetOrderListTool执行成功，userId: ${input.userId}`);
      return result;
    } catch (error) {
      this.loggerService.error(
        `GetOrderListTool执行失败，userId: ${input.userId}，错误：${error.message}`,
      );
      
      throw new ToolExecutionException('GetOrderListTool', error.message);
    }
  }
}