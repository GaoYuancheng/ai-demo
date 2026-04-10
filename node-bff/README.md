# Node BFF - Node中间层服务

基于 NestJS 构建的 Node 中间层服务，负责 Skills 与 Tools 管理、接口转发以及 AI 聊天接口的 Skills/Tools 调用逻辑。

## 项目结构

```
node-bff/
├── src/
│   ├── ai/                    # AI核心模块
│   │   ├── ai.module.ts       # AI主模块
│   │   ├── tools/             # 工具模块
│   │   │   ├── dto/           # 工具输入输出DTO
│   │   │   ├── services/      # 工具Service实现
│   │   │   └── tools.module.ts
│   │   ├── skills/            # 技能模块
│   │   │   ├── dto/           # 技能输入输出DTO
│   │   │   ├── services/      # 技能Service实现
│   │   │   └── skills.module.ts
│   │   ├── api-proxy/         # 接口代理模块
│   │   │   ├── services/      # 代理Service
│   │   │   └── api-proxy.module.ts
│   │   ├── chat-process/      # AI聊天处理模块
│   │   │   ├── services/      # 聊天处理Service
│   │   │   └── chat-process.module.ts
│   │   └── controllers/       # 控制器
│   │       ├── auth.controller.ts
│   │       ├── ai.controller.ts
│   │       ├── file.controller.ts
│   │       └── user.controller.ts
│   ├── common/                # 公共模块
│   │   ├── services/          # 公共服务（日志等）
│   │   ├── filters/           # 异常过滤器
│   │   ├── interceptors/      # 拦截器
│   │   └── common.module.ts
│   └── main.ts                # 应用启动文件
├── .env                       # 环境变量配置
├── package.json               # 项目依赖
├── tsconfig.json              # TypeScript配置
└── nest-cli.json              # NestJS CLI配置
```

## 技术栈

- **框架**: NestJS
- **语言**: TypeScript
- **HTTP客户端**: Axios (@nestjs/axios)
- **参数校验**: class-validator
- **配置管理**: @nestjs/config

## 安装依赖

```bash
npm install
```

## 环境配置

复制 `.env` 文件并根据实际情况修改配置：

```env
NODE_ENV=development
PORT=3001
BACKEND_BASE_URL=http://localhost:8080
LOG_LEVEL=info
EXTERNAL_TOKEN=
```

## 启动项目

### 开发模式
```bash
npm run start:dev
```

### 生产模式
```bash
npm run build
npm run start:prod
```

## API接口

### 认证接口

- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出

### 用户接口

- `GET /api/v1/user/info` - 获取用户信息

### AI接口

- `POST /api/v1/ai/chat` - 发送聊天消息（支持Skills/Tools调用）
- `POST /api/v1/ai/session/create` - 创建会话
- `GET /api/v1/ai/session/list` - 获取会话列表
- `GET /api/v1/ai/chat/history` - 获取聊天历史
- `DELETE /api/v1/ai/session/:sessionId` - 删除会话
- `GET /api/v1/ai/config` - 获取AI配置

### 文件接口

- `POST /api/v1/file/upload` - 文件上传

## 核心功能

### 1. Tools（工具集）

Tools 是具体的业务能力最小载体，每个 Tool 负责一个具体业务功能：

- **GetUserInfoTool**: 获取用户信息
- **GetOrderListTool**: 获取订单列表

### 2. Skills（技能集）

Skills 是 Tools 的组合与编排，面向具体业务场景：

- **UserInfoWithOrderSkill**: 组合用户信息和订单查询

### 3. 接口转发

所有后端接口通过 ApiProxyService 统一转发，实现：

- 请求参数校验
- 响应标准化
- 异常统一处理
- 日志记录

### 4. AI聊天集成

在 AI 聊天接口中集成 Skills/Tools 调用：

- 解析聊天消息，判断是否需要调用 Skills/Tools
- 执行对应的 Skill/Tool
- 将执行结果整合到聊天响应中

## 开发规范

### Tool 开发规范

1. 继承 `@Injectable()` 装饰器
2. 实现 `execute()` 方法
3. 定义输入输出 DTO
4. 使用 `class-validator` 进行参数校验
5. 抛出 `ToolExecutionException` 异常

### Skill 开发规范

1. 继承 `@Injectable()` 装饰器
2. 注入所需的 Tool Service
3. 实现 `execute()` 方法，编排 Tool 执行
4. 定义输入输出 DTO
5. 抛出 `SkillExecutionException` 异常

### 接口转发规范

1. 使用 `ApiProxyService` 统一转发
2. 不修改核心业务参数
3. 统一异常处理
4. 记录详细日志

## 测试

```bash
# 单元测试
npm run test

# E2E测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

## 构建

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

## 日志

应用使用自定义的 `LoggerService`，支持以下日志级别：

- `log()`: 普通日志
- `info()`: 信息日志
- `warn()`: 警告日志
- `error()`: 错误日志
- `debug()`: 调试日志
- `verbose()`: 详细日志

## 异常处理

应用使用全局异常过滤器 `GlobalExceptionFilter`，统一处理所有异常：

- 业务异常：`BusinessException`
- 工具执行异常：`ToolExecutionException`
- 技能执行异常：`SkillExecutionException`
- 接口转发异常：`ProxyException`

所有异常都会返回标准化的错误响应格式：

```json
{
  "code": 500,
  "message": "错误描述",
  "data": null,
  "timestamp": "2026-04-03T12:00:00.000Z",
  "path": "/api/v1/ai/chat"
}
```

## 注意事项

1. 确保 `.env` 文件中的 `BACKEND_BASE_URL` 配置正确
2. 后端服务需要先启动
3. 默认端口为 3001，可通过环境变量 `PORT` 修改
4. 支持 CORS 跨域请求

## 许可证

MIT