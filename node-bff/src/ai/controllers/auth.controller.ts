import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiProxyService } from '../api-proxy/services/api-proxy.service';

/**
 * 认证控制器
 * 负责处理用户认证相关的接口
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly apiProxyService: ApiProxyService) {}

  /**
   * 用户登录
   */
  @Post('login')
  async login(@Body() loginData: any) {
    return this.apiProxyService.authLogin(loginData);
  }

  /**
   * 用户登出
   */
  @Post('logout')
  async logout() {
    return this.apiProxyService.authLogout();
  }
}