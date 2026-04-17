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
   * AI工具检查接口转发（第一次调用，非流式，判断是否需要工具）
   */
  async checkTools(data: any) {
    try {
      this.loggerService.info(
        `接口转发（工具检查）：POST ${this.backendBaseUrl}/api/v1/ai/check-tools，参数：${JSON.stringify(data)}`,
      );

      // 从异步存储中获取 Authorization token
      const authorization = ASYNC_STORAGE.getAuthorization();
      this.loggerService.info(`获取到的 Authorization: ${authorization}`);

      const requestConfig = {
        url: `${this.backendBaseUrl}/api/v1/ai/check-tools`,
        method: 'POST' as const,
        data,
        headers: {
          'Content-Type': 'application/json',
          ...(authorization && { Authorization: authorization }),
        },
      };

      const axiosResponse = await this.httpService.axiosRef.request(requestConfig);
      this.loggerService.info(`接口转发成功：POST /api/v1/ai/check-tools`);

      // 解析后端返回的数据
      const responseData = axiosResponse.data;

      // 判断后端接口是否返回异常
      if (responseData && typeof responseData === 'object' && 'code' in responseData) {
        if (responseData.code !== 200) {
          this.loggerService.error(
            `后端接口返回异常：POST /api/v1/ai/check-tools，code：${responseData.code}，message：${responseData.message}`,
          );
          throw new ProxyException(
            `${this.backendBaseUrl}/api/v1/ai/check-tools`,
            responseData.message || '后端接口返回异常',
            responseData.code,
          );
        }
      }

      // 解析data字段
      const parsedData =
        responseData && typeof responseData === 'object' && 'data' in responseData
          ? responseData.data
          : responseData;

      return parsedData;
    } catch (error) {
      this.loggerService.error(
        `接口转发失败：POST /api/v1/ai/check-tools，错误信息：${error.message}`,
      );
      throw new ProxyException(`${this.backendBaseUrl}/api/v1/ai/check-tools`, error.message);
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

      // 直接转发流式数据，不做任何处理
      axiosResponse.data.on('data', (chunk: Buffer) => {
        response.write(chunk);
      });

      // 处理流结束
      return new Promise<void>((resolve, reject) => {
        axiosResponse.data.on('end', () => {
          this.loggerService.info(`流式响应结束：${method} ${path}`);
          response.end();
          resolve();
        });
        axiosResponse.data.on('error', (error: any) => {
          this.loggerService.error(`流式响应错误：${method} ${path}，错误信息：${error.message}`);
          response.status(500).json({
            code: 500,
            message: `接口转发失败：${error.message}`,
            data: null,
          });
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

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"用户","role":"assistant"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"想"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"查询杭州2"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"02"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"6年4月"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"1"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"6日的天气。"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"我需要使用get_current"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"_weather"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"工具来查询天气"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"信息。\n\n但是"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"需要注意，这个工具"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"只能"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"查询当前或近期的"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"天气，无法"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"预测未来特定日期"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"（如20"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"26年）"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"的天气。不过我还是"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"会调用这个工具"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"，"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"看看返回什么结果"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"。\n\n参数需要"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"location，用户说的是"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"\"杭州\"，"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"所以我应该使用\""},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"杭州市\"作为location"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":"参数。"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":null,"tool_calls":[{"index":0,"id":"call_b24c21aa4905423d813479e4","type":"function","function":{"name":"get_current_weather","arguments":""}}]},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":null,"tool_calls":[{"index":0,"id":"","type":"function","function":{"arguments":"{\"location\": \"杭州市"}}]},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":null,"tool_calls":[{"index":0,"id":"","type":"function","function":{"arguments":"\""}}]},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"content":null,"reasoning_content":null,"tool_calls":[{"index":0,"id":"","type":"function","function":{"arguments":"}"}}]},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"delta":{"tool_calls":[{"function":{"arguments":""},"index":0,"id":"","type":"function"}]},"index":0}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: {"choices":[{"finish_reason":"tool_calls","delta":{"content":"","reasoning_content":null},"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1776307217,"system_fingerprint":null,"model":"qwen3.5-flash","id":"chatcmpl-34d8a53b-a10d-9c35-b462-cfededf90646"}

// data: [DONE]
