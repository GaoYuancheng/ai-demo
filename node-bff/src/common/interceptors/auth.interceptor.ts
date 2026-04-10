import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ASYNC_STORAGE } from '../services/async-local-storage.service';

/**
 * 认证信息拦截器
 * 从请求头中提取 Authorization token 并存储到异步存储中
 * 供后续的 API 代理服务使用
 */
@Injectable()
export class AuthInterceptor implements NestInterceptor {
  constructor() {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // 从请求头中提取 Authorization token
    const authorization = request.headers['authorization'];

    // 创建请求上下文存储
    const requestContext = {
      authorization: authorization,
    };

    // 在异步存储上下文中执行后续处理
    return ASYNC_STORAGE.run(requestContext, async () => {
      return next.handle();
    });
  }
}
