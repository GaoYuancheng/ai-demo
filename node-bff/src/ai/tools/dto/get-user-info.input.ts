import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 获取用户信息输入DTO
 */
export class GetUserInfoInput {
  @IsString({ message: 'userId必须为字符串' })
  @IsNotEmpty({ message: 'userId不能为空' })
  userId: string;
}