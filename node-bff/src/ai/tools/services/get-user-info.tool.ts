import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../common/services/logger.service';
import { GetUserInfoInput } from '../dto/get-user-info.input';
import { GetUserInfoOutput } from '../dto/get-user-info.output';
import { ToolExecutionException } from '../../../common/exceptions/business.exception';

/**
 * 获取用户信息工具
 * 示例工具，用于演示Tool的实现方式
 */
@Injectable()
export class GetUserInfoTool {
  constructor(
    private readonly httpService: HttpService,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.loggerService.setContext('GetUserInfoTool');
  }

  /**
   * 执行工具逻辑
   * @param input 输入参数
   * @returns 输出结果
   */
  async execute(input: GetUserInfoInput): Promise<GetUserInfoOutput> {
    try {
      this.loggerService.info(`GetUserInfoTool执行，userId: ${input.userId}`);
      
      const backendBaseUrl = this.configService.get<string>('BACKEND_BASE_URL');
      
      const response = await firstValueFrom(
        this.httpService.get(`${backendBaseUrl}/api/v1/user/${input.userId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      if (!response.data || !response.data.success) {
        throw new NotFoundException('用户信息查询失败');
      }

      const result: GetUserInfoOutput = {
        userId: response.data.data.userId,
        name: response.data.data.username,
        phone: response.data.data.phone || '',
        email: response.data.data.email || '',
        createTime: response.data.data.createTime,
      };

      this.loggerService.info(`GetUserInfoTool执行成功，userId: ${input.userId}`);
      return result;
    } catch (error) {
      this.loggerService.error(
        `GetUserInfoTool执行失败，userId: ${input.userId}，错误：${error.message}`,
      );
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new ToolExecutionException('GetUserInfoTool', error.message);
    }
  }
}