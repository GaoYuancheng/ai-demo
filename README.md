# AI Demo 项目

## 项目简介

AI Demo 是一个基于 Spring Boot + React 的智能聊天应用，集成了 OpenAI 兼容的 API 接口，支持用户认证、聊天会话管理和文件上传等功能。

## 技术栈

### 后端
- Spring Boot 3.2.3
- Java 17
- MyBatis-Plus 3.5.5
- Spring Security
- JWT 认证
- MySQL 8.0
- Hutool 工具库

### 前端
- React 18.3.1
- TypeScript
- Ant Design 6.3.4
- Vite 8.0.2
- React Router 7.0.2
- Axios

## 项目结构

```
ai-demo/
├── backend/           # 后端服务
│   ├── src/           # 源代码
│   │   ├── main/
│   │   │   ├── java/com/example/aidemo/  # Java 代码
│   │   │   │   ├── ai/           # AI 相关功能
│   │   │   │   ├── auth/         # 认证相关功能
│   │   │   │   ├── common/       # 通用组件
│   │   │   │   ├── config/       # 配置类
│   │   │   │   ├── file/         # 文件上传功能
│   │   │   │   ├── security/     # 安全配置
│   │   │   │   ├── user/         # 用户管理
│   │   │   │   └── AiDemoApplication.java  # 应用入口
│   │   │   └── resources/        # 资源文件
│   │   │       ├── application.yml  # 配置文件
│   │   │       ├── data.sql      # 数据初始化脚本
│   │   │       └── schema.sql    # 数据库表结构
│   └── pom.xml        # Maven 依赖配置
├── frontend/          # 前端应用
│   ├── src/           # 源代码
│   │   ├── api/       # API 调用
│   │   ├── contexts/  # 上下文管理
│   │   ├── pages/     # 页面组件
│   │   ├── providers/ # 提供者组件
│   │   ├── types/     # 类型定义
│   │   ├── utils/     # 工具函数
│   │   ├── App.tsx    # 应用入口
│   │   └── main.tsx   # 主入口
│   ├── index.html     # HTML 模板
│   ├── package.json   # 依赖配置
│   └── vite.config.ts # Vite 配置
└── .gitignore         # Git 忽略文件
```

## 核心功能

### 1. AI 聊天功能
- 支持与 AI 模型进行对话
- 会话管理（创建、切换、删除）
- 聊天历史记录
- 模型配置管理

### 2. 用户认证
- 用户注册
- 用户登录
- JWT 令牌验证
- 权限控制

### 3. 文件上传
- 支持文件上传功能
- 文件存储管理

## 环境要求

### 后端
- JDK 17+
- Maven 3.6+
- MySQL 8.0+

### 前端
- Node.js 18+
- pnpm 9+

## 快速开始

### 1. 数据库准备

1. 创建数据库 `ai_demo`
2. 执行 `backend/src/main/resources/schema.sql` 创建表结构
3. 执行 `backend/src/main/resources/data.sql` 初始化数据

### 2. 配置 AI API Key

在后端根目录创建 `.env` 文件，添加以下配置：

```properties
AI_API_KEY=your_openai_api_key
```

### 3. 启动后端服务

```bash
cd backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动。

### 4. 启动前端服务

```bash
cd frontend
pnpm install
pnpm dev
```

前端服务将在 `http://localhost:5173` 启动。

## API 接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### AI 接口
- `GET /api/ai/config` - 获取 AI 配置
- `PUT /api/ai/config` - 更新 AI 配置
- `POST /api/ai/sessions` - 创建会话
- `GET /api/ai/sessions` - 获取会话列表
- `GET /api/ai/sessions/{id}` - 获取会话详情
- `DELETE /api/ai/sessions/{id}` - 删除会话
- `POST /api/ai/chat` - 发送聊天消息

### 文件接口
- `POST /api/files/upload` - 上传文件

## 配置说明

### 后端配置

主要配置文件：`backend/src/main/resources/application.yml`

- 服务器配置：端口、应用名称
- 数据库配置：连接信息
- JWT 配置：密钥、过期时间
- AI 配置：API Key、模型、参数
- 文件上传配置：上传路径

### 前端配置

API 基础路径配置：`frontend/src/utils/request.ts`

## 开发说明

### 后端开发
1. 使用 Maven 管理依赖
2. 遵循 Spring Boot 最佳实践
3. 使用 MyBatis-Plus 进行数据库操作
4. 使用 JWT 进行身份认证

### 前端开发
1. 使用 pnpm 管理依赖
2. 使用 TypeScript 保证类型安全
3. 使用 Ant Design 组件库
4. 使用 React Router 进行路由管理
5. 使用 Axios 进行 API 调用

## 部署说明

### 后端部署
1. 构建 jar 包：`mvn clean package`
2. 运行 jar 包：`java -jar target/ai-demo-1.0.0.jar`

### 前端部署
1. 构建静态文件：`pnpm build`
2. 将 `dist` 目录部署到静态文件服务器

## 注意事项

1. 确保 MySQL 服务正常运行
2. 配置正确的 AI API Key
3. 前端和后端服务需在不同端口运行
4. 生产环境需修改 JWT 密钥和数据库密码

## 许可证

本项目采用 MIT 许可证。
