import { Controller, Get } from '@nestjs/common';
import { ApiProxyService } from '../api-proxy/services/api-proxy.service';

/**
 * 用户控制器
 * 负责处理用户信息相关的接口
 */
@Controller('user')
export class UserController {
  constructor(private readonly apiProxyService: ApiProxyService) {}

  /**
   * 获取用户信息
   */
  @Get('info')
  async getUserInfo() {
    return this.apiProxyService.getUserInfo();
  }
}