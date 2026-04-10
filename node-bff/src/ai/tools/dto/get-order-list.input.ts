import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

/**
 * 获取订单列表输入DTO
 */
export class GetOrderListInput {
  @IsString({ message: 'userId必须为字符串' })
  @IsNotEmpty({ message: 'userId不能为空' })
  userId: string;

  @IsNumber({}, { message: 'page必须为数字' })
  @Min(1, { message: 'page不能小于1' })
  page: number = 1;

  @IsNumber({}, { message: 'pageSize必须为数字' })
  @Min(1, { message: 'pageSize不能小于1' })
  pageSize: number = 10;
}