项目背景
基于 React + Ant Design X 构建 AI 交互前端，Java 搭建后端服务，实现用户与 AI 模型的对话交互、历史记录管理、密钥管理等核心功能，前后端通过 RESTful API 通信。

文档说明
本文档定义前后端交互的接口规范、请求 / 响应格式、错误码
后端基于 API Key 对接第三方 AI 服务，密钥由后端统一管理，前端不直接存储
接口遵循 RESTful 设计风格，统一返回格式

技术栈
全部使用最新版本
前端：React 18+、Ant Design X、TypeScript
后端：Java（SpringBoot 3.x）、Spring MVC、MyBatis/MyBatis-Plus
通信：HTTP/HTTPS、JSON、JWT 鉴权

文件夹
前端项目在 frontend 目录下，后端项目在 backend 目录下。

二、基础规范

1. 接口地址规范
   开发环境：http://localhost:8080/api/v1
   生产环境：https://xxx.com/api/v1
   接口路径统一前缀：/api/v1
2. 请求 / 响应格式
   请求头：Content-Type: application/json; charset=utf-8
   响应格式：统一 JSON 结构
   json
   {
   "code": 200, // 状态码：200成功，非200失败
   "message": "success", // 提示信息
   "data": {} // 业务数据（成功时返回，失败可为null）
   }
3. 通用状态码
   表格
   状态码 含义 说明
   200 请求成功 接口正常返回数据
   400 参数错误 请求参数格式 / 必填项错误
   401 未授权 未登录 / Token 过期
   403 无权限 接口访问权限不足
   404 接口不存在 请求路径错误
   500 服务器错误 后端服务异常
   601 AI 服务异常 第三方 AI 模型调用失败
4. 鉴权规范
   登录成功后返回 token，前端存储于 localStorage
   所有业务接口请求头携带：Authorization: Bearer {token}
   三、接口详情
5. 用户认证模块
   1.1 用户登录
   接口地址：POST /auth/login
   请求参数
   json
   {
   "username": "string", // 用户名（必填）
   "password": "string" // 密码（必填，MD5加密）
   }
   响应参数
   json
   {
   "code": 200,
   "message": "登录成功",
   "data": {
   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // 身份令牌
   "userId": 10001,
   "username": "test_user"
   }
   }
   1.2 用户登出
   接口地址：POST /auth/logout
   请求头：Authorization: Bearer {token}
   响应参数
   json
   {
   "code": 200,
   "message": "登出成功",
   "data": null
   }
6. AI 对话模块（核心）
   2.1 发送 AI 对话消息（流式 / 非流式）
   接口地址：POST /ai/chat
   请求头：Authorization: Bearer {token}
   请求参数
   json
   {
   "sessionId": "string", // 会话ID（新建会话传空，复用传已有值）
   "message": "string", // 用户提问内容（必填）
   "model": "string", // AI模型名称（默认：gpt-3.5）
   "stream": false // 是否流式返回：true=流式，false=普通返回
   }
   非流式响应
   json
   {
   "code": 200,
   "message": "success",
   "data": {
   "sessionId": "s_123456",
   "requestId": "req_789012",
   "aiReply": "AI 回复的完整内容",
   "createTime": "2026-03-25 15:30:00"
   }
   }
   流式响应：后端返回 text/event-stream 格式，前端逐帧接收渲染
   2.2 创建 AI 对话会话
   接口地址：POST /ai/session/create
   请求头：Authorization: Bearer {token}
   请求参数
   json
   {
   "title": "新对话会话" // 会话标题（可选，默认：新对话）
   }
   响应参数
   json
   {
   "code": 200,
   "message": "创建成功",
   "data": {
   "sessionId": "s_123456",
   "title": "新对话会话",
   "createTime": "2026-03-25 15:25:00"
   }
   }
   2.3 获取会话历史消息
   接口地址：GET /ai/chat/history
   请求头：Authorization: Bearer {token}
   请求参数：sessionId=string（必填）
   响应参数
   json
   {
   "code": 200,
   "message": "success",
   "data": {
   "sessionId": "s_123456",
   "title": "AI 咨询",
   "messages": [
   {
   "role": "user",
   "content": "你好",
   "createTime": "2026-03-25 15:26:00"
   },
   {
   "role": "assistant",
   "content": "你好！有什么可以帮你？",
   "createTime": "2026-03-25 15:26:01"
   }
   ]
   }
   }
   2.4 获取用户所有会话列表
   接口地址：GET /ai/session/list
   请求头：Authorization: Bearer {token}
   响应参数
   json
   {
   "code": 200,
   "message": "success",
   "data": [
   {
   "sessionId": "s_123456",
   "title": "AI 咨询",
   "updateTime": "2026-03-25 15:30:00"
   },
   {
   "sessionId": "s_789012",
   "title": "代码生成",
   "updateTime": "2026-03-25 14:20:00"
   }
   ]
   }
   2.5 删除对话会话
   接口地址：DELETE /ai/session/{sessionId}
   请求头：Authorization: Bearer {token}
   响应参数
   json
   {
   "code": 200,
   "message": "删除成功",
   "data": null
   }
7. AI 服务配置模块
   3.1 获取 AI 配置信息
   接口地址：GET /ai/config
   请求头：Authorization: Bearer {token}
   响应参数（后端内置 API Key，不返回给前端）
   json
   {
   "code": 200,
   "message": "success",
   "data": {
   "modelList": ["gpt-3.5-turbo", "gpt-4", "claude-3"], // 支持的模型列表
   "maxTokens": 2000,
   "temperature": 0.7
   }
   }
   3.2 更新 AI 配置（管理员）
   接口地址：PUT /ai/config
   请求头：Authorization: Bearer {token}
   请求参数
   json
   {
   "model": "gpt-4",
   "maxTokens": 3000,
   "temperature": 0.8
   }
   响应参数
   json
   {
   "code": 200,
   "message": "配置更新成功",
   "data": null
   }
8. 系统通用模块
   4.1 获取用户信息
   接口地址：GET /user/info
   请求头：Authorization: Bearer {token}
   响应参数
   json
   {
   "code": 200,
   "message": "success",
   "data": {
   "userId": 10001,
   "username": "test_user",
   "role": "user", // user=普通用户 admin=管理员
   "createTime": "2026-03-01 10:00:00"
   }
   }
   4.2 上传文件（AI 识图 / 文档解析）
   接口地址：POST /file/upload
   请求头：Authorization: Bearer {token}、Content-Type: multipart/form-data
   请求参数：file=文件对象
   响应参数
   json
   {
   "code": 200,
   "message": "上传成功",
   "data": {
   "fileUrl": "https://xxx.com/files/20260325/test.pdf",
   "fileName": "test.pdf",
   "fileSize": 102400
   }
   }
   四、后端 API Key 管理规范
   存储位置：后端配置文件（application.yml）或环境变量，绝不暴露给前端
   配置示例（application.yml）
   yaml
   ai:
   api-key: ${AI_API_KEY:sk-xxxxxxxxxxxxxxxx} # 你的API Key
   base-url: https://api.openai.com/v1
   timeout: 30000
   调用逻辑：后端接收前端请求 → 校验权限 → 携带 API Key 调用第三方 AI 服务 → 返回结果给前端
   五、前端对接说明（Ant Design X + React）
   请求封装：使用 Axios 封装请求，统一携带 Token、处理响应 / 错误
   流式对话：使用 EventSource 或 Axios 流式解析后端返回的 SSE 数据
   页面适配：
   对话页面：Ant Design X Input、Button、List 组件
   历史记录：Tree/Menu 组件展示会话列表
   加载状态：Spin 组件优化交互
   六、错误响应示例
   json
   {
   "code": 601,
   "message": "AI 模型调用失败：API Key 无效",
   "data": null
   }
   json
   {
   "code": 400,
   "message": "参数错误：message 不能为空",
   "data": null
   }
   总结
   这份文档覆盖登录认证、AI 对话、会话管理、配置、文件上传全场景，直接满足 React+AntD X 前端 + Java 后端开发需求
   后端内置 API Key，安全不泄露，前端无需处理密钥相关逻辑
   接口统一返回格式、状态码，前后端对接零歧义
   你只需要补充自己的 API Key 到后端配置文件，即可基于此文档开发项目
