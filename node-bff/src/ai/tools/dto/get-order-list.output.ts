/**
 * 订单信息DTO
 */
export class OrderInfo {
  orderId: string;
  orderNo: string;
  amount: number;
  status: string;
  createTime: string;
}

/**
 * 获取订单列表输出DTO
 */
export class GetOrderListOutput {
  orderList: OrderInfo[];
  total: number;
  page: number;
  pageSize: number;
}