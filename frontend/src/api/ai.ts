import request from '@/utils/request';
import {
  Result,
  ChatRequest,
  ChatResponse,
  SessionResponse,
  ChatHistoryResponse,
  AiConfigResponse,
} from '@/types';

export const aiApi = {
  chat: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await request.post<Result<ChatResponse>>('/ai/chat', {
      ...data,
      stream: false,
    });
    return response.data.data;
  },

  chatStream: async (
    data: ChatRequest,
    onChunk: (content: string) => void,
    onSessionId?: (sessionId: string) => void
  ): Promise<void> => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/v1/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...data,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error('请求失败');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const jsonStr = line.substring(5).trim();
          if (jsonStr) {
            try {
              const json = JSON.parse(jsonStr);
              if (json.sessionId && onSessionId) {
                onSessionId(json.sessionId);
              }
              if (json.content) {
                onChunk(json.content);
              }
              if (json.error) {
                throw new Error(json.error);
              }
            } catch (e) {
              if (e instanceof SyntaxError) {
                continue;
              }
              throw e;
            }
          }
        }
      }
    }
  },

  createSession: async (title?: string): Promise<SessionResponse> => {
    const response = await request.post<Result<SessionResponse>>('/ai/session/create', { title });
    return response.data.data;
  },

  getSessionList: async (): Promise<SessionResponse[]> => {
    const response = await request.get<Result<SessionResponse[]>>('/ai/session/list');
    return response.data.data;
  },

  getChatHistory: async (sessionId: string): Promise<ChatHistoryResponse> => {
    const response = await request.get<Result<ChatHistoryResponse>>('/ai/chat/history', {
      params: { sessionId },
    });
    return response.data.data;
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await request.delete<Result<null>>(`/ai/session/${sessionId}`);
  },

  getConfig: async (): Promise<AiConfigResponse> => {
    const response = await request.get<Result<AiConfigResponse>>('/ai/config');
    return response.data.data;
  },
};
