import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * 请求上下文存储接口
 */
export interface RequestContext {
  authorization?: string;
  userId?: number;
  username?: string;
}

/**
 * 异步存储服务
 * 用于在请求上下文中存储和获取数据
 * 主要用于存储认证信息，供后续的 API 代理服务使用
 */
@Injectable({ scope: Scope.DEFAULT })
export class AsyncLocalStorageService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

  /**
   * 运行回调函数，并在执行期间存储请求上下文
   * @param store 请求上下文数据
   * @param callback 要执行的回调函数
   * @returns 回调函数的返回值
   */
  async run<T>(store: RequestContext, callback: () => Promise<T>): Promise<T> {
    return this.asyncLocalStorage.run(store, callback);
  }

  /**
   * 获取当前请求上下文
   * @returns 请求上下文数据
   */
  getStore(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * 获取当前请求的 Authorization token
   * @returns Authorization token
   */
  getAuthorization(): string | undefined {
    const store = this.getStore();
    return store?.authorization;
  }

  /**
   * 设置当前请求的 Authorization token
   * @param authorization Authorization token
   */
  setAuthorization(authorization: string): void {
    const store = this.getStore();
    if (store) {
      store.authorization = authorization;
    }
  }

  /**
   * 获取当前请求的用户ID
   * @returns 用户ID
   */
  getUserId(): number | undefined {
    const store = this.getStore();
    return store?.userId;
  }

  /**
   * 设置当前请求的用户ID
   * @param userId 用户ID
   */
  setUserId(userId: number): void {
    const store = this.getStore();
    if (store) {
      store.userId = userId;
    }
  }

  /**
   * 获取当前请求的用户名
   * @returns 用户名
   */
  getUsername(): string | undefined {
    const store = this.getStore();
    return store?.username;
  }

  /**
   * 设置当前请求的用户名
   * @param username 用户名
   */
  setUsername(username: string): void {
    const store = this.getStore();
    if (store) {
      store.username = username;
    }
  }
}

/**
 * 导出单例实例，供其他模块使用
 */
export const ASYNC_STORAGE = new AsyncLocalStorageService();
