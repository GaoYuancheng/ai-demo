import { GetUserInfoOutput } from '../../tools/dto/get-user-info.output';
import { GetOrderListOutput } from '../../tools/dto/get-order-list.output';

/**
 * 用户信息与订单技能输出DTO
 */
export class UserInfoWithOrderOutput {
  userInfo: GetUserInfoOutput;
  orderList: GetOrderListOutput['orderList'];
  total: number;
  page: number;
  pageSize: number;
}