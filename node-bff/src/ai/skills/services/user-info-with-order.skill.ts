import { Injectable } from '@nestjs/common';
import { UserInfoWithOrderInput } from '../dto/user-info-with-order.input';
import { UserInfoWithOrderOutput } from '../dto/user-info-with-order.output';
import { GetUserInfoTool } from '../../tools/services/get-user-info.tool';
import { GetOrderListTool } from '../../tools/services/get-order-list.tool';
import { LoggerService } from '../../../common/services/logger.service';
import { SkillExecutionException } from '../../../common/exceptions/business.exception';

/**
 * 用户信息与订单技能
 * 示例技能，组合GetUserInfoTool和GetOrderListTool
 */
@Injectable()
export class UserInfoWithOrderSkill {
  constructor(
    private readonly getUserInfoTool: GetUserInfoTool,
    private readonly getOrderListTool: GetOrderListTool,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.setContext('UserInfoWithOrderSkill');
  }

  /**
   * 执行技能逻辑
   * @param input 输入参数
   * @returns 输出结果
   */
  async execute(input: UserInfoWithOrderInput): Promise<UserInfoWithOrderOutput> {
    try {
      this.loggerService.info(
        `UserInfoWithOrderSkill执行，userId: ${input.userId}`,
      );

      const userInfo = await this.getUserInfoTool.execute({
        userId: input.userId,
      });

      const orderListResult = await this.getOrderListTool.execute({
        userId: input.userId,
        page: input.page,
        pageSize: input.pageSize,
      });

      const result: UserInfoWithOrderOutput = {
        userInfo,
        orderList: orderListResult.orderList,
        total: orderListResult.total,
        page: input.page,
        pageSize: input.pageSize,
      };

      this.loggerService.info(
        `UserInfoWithOrderSkill执行成功，userId: ${input.userId}`,
      );
      return result;
    } catch (error) {
      this.loggerService.error(
        `UserInfoWithOrderSkill执行失败，userId: ${input.userId}，错误：${error.message}`,
      );
      
      throw new SkillExecutionException('UserInfoWithOrderSkill', error.message);
    }
  }
}