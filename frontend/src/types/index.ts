export interface Result<T> {
  code: number;
  message: string;
  data: T;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  username: string;
}

export interface UserInfo {
  userId: number;
  username: string;
  role: string;
  createTime: string;
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
  model?: string;
  stream?: boolean;
}

export interface ChatResponse {
  sessionId: string;
  requestId: string;
  aiReply: string;
  createTime: string;
}

export interface SessionResponse {
  sessionId: string;
  title: string;
  createTime: string;
  updateTime: string;
}

export interface MessageDto {
  role: string;
  content: string;
  createTime: string;
}

export interface ChatHistoryResponse {
  sessionId: string;
  title: string;
  messages: MessageDto[];
}

export interface AiConfigResponse {
  modelList: string[];
  maxTokens: number;
  temperature: number;
}

export interface FileUploadResponse {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}
