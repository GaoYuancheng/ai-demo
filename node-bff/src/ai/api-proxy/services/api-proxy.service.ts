import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../common/services/logger.service';
import { ProxyException } from '../../../common/exceptions/business.exception';
import { ASYNC_STORAGE } from '../../../common/services/async-local-storage.service';

/**
 * 接口代理服务
 * 负责所有接口的统一转发逻辑
 */
@Injectable()
export class ApiProxyService {
  private readonly backendBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.backendBaseUrl =
      this.configService.get<string>('BACKEND_BASE_URL') || 'http://localhost:8080';
    this.loggerService.setContext('ApiProxyService');
  }

  /**
   * 统一转发方法
   * @param method HTTP方法
   * @param path 请求路径
   * @param data 请求体数据
   * @param params 查询参数
   * @param headers 请求头
   * @returns 转发结果
   */
  private async proxyRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: any,
    params?: any,
    headers?: any,
  ) {
    try {
      this.loggerService.info(
        `接口转发：${method} ${this.backendBaseUrl}${path}，参数：${JSON.stringify(data)}，查询参数：${JSON.stringify(params)}`,
      );

      // 从异步存储中获取 Authorization token
      const authorization = ASYNC_STORAGE.getAuthorization();
      this.loggerService.info(`获取到的 Authorization: ${authorization}`);

      const requestConfig = {
        url: `${this.backendBaseUrl}${path}`,
        method,
        data,
        params,
        headers: {
          'Content-Type': 'application/json',
          ...(authorization && { Authorization: authorization }),
          ...headers,
        },
      };

      const response = await firstValueFrom(this.httpService.request(requestConfig));

      this.loggerService.info(`接口转发成功：${method} ${path}`);

      // 解析后端返回的数据
      const responseData = response.data;

      // 判断后端接口是否返回异常
      if (responseData && typeof responseData === 'object' && 'code' in responseData) {
        if (responseData.code !== 200) {
          this.loggerService.error(
            `后端接口返回异常：${method} ${path}，code：${responseData.code}，message：${responseData.message}`,
          );
          throw new ProxyException(
            `${this.backendBaseUrl}${path}`,
            responseData.message || '后端接口返回异常',
            responseData.code,
          );
        }
      }

      // 默认解析一层data
      const parsedData =
        responseData && typeof responseData === 'object' && 'data' in responseData
          ? responseData.data
          : responseData;

      return {
        code: 200,
        message: '请求成功',
        data: parsedData,
      };
    } catch (error) {
      this.loggerService.error(`接口转发失败：${method} ${path}，错误信息：${error.message}`);

      throw new ProxyException(`${this.backendBaseUrl}${path}`, error.message);
    }
  }

  /**
   * 认证接口转发 - 登录
   */
  async authLogin(data: any) {
    return this.proxyRequest('POST', '/api/v1/auth/login', data);
  }

  /**
   * 认证接口转发 - 登出
   */
  async authLogout() {
    return this.proxyRequest('POST', '/api/v1/auth/logout');
  }

  /**
   * 用户接口转发 - 获取用户信息
   */
  async getUserInfo() {
    return this.proxyRequest('GET', '/api/v1/user/info');
  }

  /**
   * AI聊天接口转发（单独封装，用于集成Skills/Tools调用）
   */
  async aiChat(data: any, response: any) {
    const { stream } = data;

    if (stream) {
      // 流式响应处理
      return this.proxyRequestStream('POST', '/api/v1/ai/chat', data, null, null, response);
    } else {
      // 非流式响应处理 - 直接调用后端的聊天接口
      try {
        this.loggerService.info(
          `接口转发（非流式）：POST ${this.backendBaseUrl}/api/v1/ai/chat，参数：${JSON.stringify(data)}`,
        );

        // 从异步存储中获取 Authorization token
        const authorization = ASYNC_STORAGE.getAuthorization();
        this.loggerService.info(`获取到的 Authorization: ${authorization}`);

        const requestConfig = {
          url: `${this.backendBaseUrl}/api/v1/ai/chat`,
          method: 'POST' as const,
          data,
          headers: {
            'Content-Type': 'application/json',
            ...(authorization && { Authorization: authorization }),
          },
        };

        const axiosResponse = await this.httpService.axiosRef.request(requestConfig);
        this.loggerService.info(`接口转发成功：POST /api/v1/ai/chat`);

        // 直接返回响应数据
        return axiosResponse.data;
      } catch (error) {
        this.loggerService.error(`接口转发失败：POST /api/v1/ai/chat，错误信息：${error.message}`);
        throw new ProxyException(`${this.backendBaseUrl}/api/v1/ai/chat`, error.message);
      }
    }
  }

  /**
   * 流式请求转发方法
   * @param method HTTP方法
   * @param path 请求路径
   * @param data 请求体数据
   * @param params 查询参数
   * @param headers 请求头
   * @param response 响应对象
   */
  private async proxyRequestStream(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: any,
    params?: any,
    headers?: any,
    response?: any,
  ) {
    try {
      this.loggerService.info(
        `接口转发（流式）：${method} ${this.backendBaseUrl}${path}，参数：${JSON.stringify(data)}`,
      );

      // 从异步存储中获取 Authorization token
      const authorization = ASYNC_STORAGE.getAuthorization();
      this.loggerService.info(`获取到的 Authorization: ${authorization}`);

      const requestConfig = {
        url: `${this.backendBaseUrl}${path}`,
        method,
        data,
        params,
        headers: {
          'Content-Type': 'application/json',
          ...(authorization && { Authorization: authorization }),
          ...headers,
        },
        responseType: 'stream' as const,
      };

      if (!response) {
        throw new Error('流式响应需要提供响应对象');
      }

      // 发起流式请求
      const axiosResponse = await this.httpService.axiosRef.request(requestConfig);

      // 检查响应状态
      if (axiosResponse.status !== 200) {
        throw new Error(`HTTP ${axiosResponse.status}: ${axiosResponse.statusText}`);
      }

      // 设置响应头
      response.setHeader('Content-Type', 'text/event-stream');
      response.setHeader('Cache-Control', 'no-cache');
      response.setHeader('Connection', 'keep-alive');

      // 管道流数据到响应
      axiosResponse.data.pipe(response);

      // 处理流结束
      return new Promise<void>((resolve, reject) => {
        axiosResponse.data.on('end', () => {
          this.loggerService.info(`流式响应结束：${method} ${path}`);
          resolve();
        });
        axiosResponse.data.on('error', (error: any) => {
          this.loggerService.error(`流式响应错误：${method} ${path}，错误信息：${error.message}`);
          reject(error);
        });
      });
    } catch (error) {
      this.loggerService.error(
        `接口转发（流式）失败：${method} ${path}，错误信息：${error.message}`,
      );

      if (response) {
        response.status(500).json({
          code: 500,
          message: `接口转发失败：${error.message}`,
          data: null,
        });
      }

      throw new ProxyException(`${this.backendBaseUrl}${path}`, error.message);
    }
  }

  /**
   * AI接口转发 - 创建会话
   */
  async createAiSession(data: any) {
    return this.proxyRequest('POST', '/api/v1/ai/session/create', data);
  }

  /**
   * AI接口转发 - 获取会话列表
   */
  async getAiSessions() {
    return this.proxyRequest('GET', '/api/v1/ai/session/list');
  }

  /**
   * AI接口转发 - 获取聊天历史
   */
  async getAiChatHistory(params: any) {
    return this.proxyRequest('GET', '/api/v1/ai/chat/history', null, params);
  }

  /**
   * AI接口转发 - 删除会话
   */
  async deleteAiSession(sessionId: string) {
    return this.proxyRequest('DELETE', `/api/v1/ai/session/${sessionId}`);
  }

  /**
   * AI接口转发 - 获取AI配置
   */
  async getAiConfig() {
    return this.proxyRequest('GET', '/api/v1/ai/config');
  }

  /**
   * 文件接口转发 - 文件上传
   */
  async fileUpload(data: any) {
    return this.proxyRequest('POST', '/api/v1/file/upload', data);
  }
}
