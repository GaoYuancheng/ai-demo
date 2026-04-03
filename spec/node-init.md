# Node中间层（NestJS）Skills与Tools模块Spec文档（含接口转发）

# 1. 文档概述

## 1.1 文档目的

本文档仅聚焦基于NestJS构建的Node中间层服务，明确中间层中Skills（技能集）与Tools（工具集）的核心设计、注册规范、调度逻辑，同时规范已有后端接口的转发逻辑，重点在AI聊天接口中融入Skills与Tools调用逻辑，为Node中间层开发、测试验证提供统一标准，确保模块可复用、可扩展、可维护，全程不涉及前端（AI Agent界面）、后端的内部实现细节，仅规范Node中间层自身的接口转发、Skills与Tools管理能力。

## 1.2 适用范围

- Node中间层开发（NestJS）：负责基于NestJS框架开发、注册、调度、维护Skills与Tools，实现后端接口转发及AI聊天接口的Skills/Tools调用逻辑

- 测试人员：负责Node中间层（NestJS）Skills与Tools的功能测试、接口转发测试、AI聊天接口的工具调用测试及异常场景验证

## 1.3 术语定义

- Node中间层：基于NestJS框架构建的独立服务，核心职责是管理、调度Skills与Tools，转发已有后端接口，在AI聊天接口中集成Skills/Tools调用逻辑，提供标准化接口供外部调用，不直接对接用户交互或大模型内部逻辑。

- Tools（工具集）：Node中间层（NestJS）封装的独立业务函数，基于NestJS Service实现，具备明确的输入输出规范，是具体业务能力的最小载体，可独立执行、独立注册，供Skills组合使用或在AI聊天接口中被调用。

- Skills（技能集）：Node中间层（NestJS）对单个或多个Tools的组合、流程编排与规则封装，基于NestJS Service实现，是面向外部调用的“能力集合”，可在AI聊天接口中被触发执行。

- 接口转发：Node中间层接收外部请求后，对请求进行参数校验、权限校验（如需），不修改核心业务参数，将请求透传给已有后端接口，接收后端响应后，标准化处理并返回给外部的过程。

- AI聊天接口Tools/Skills调用：Node中间层在转发AI聊天请求至后端前，解析请求内容，判断是否需要调用Skills或Tools，执行对应逻辑后，将工具/技能执行结果与聊天请求一同转发至后端；或接收后端返回的工具调用指令，执行对应Skills/Tools后，将结果回传给后端，最终整合响应返回给外部。

- NestJS核心特性适配：依托NestJS的模块（Module）、服务（Service）、依赖注入（Dependency Injection）、拦截器（Interceptor）、过滤器（Filter）等特性，实现Skills与Tools的模块化管理、接口转发、统一异常处理、日志记录等。

## 1.4 版本信息

| 版本号 | 更新日期   | 更新内容                                                                                                                        | 更新人 |
| ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------- | ------ |
| V1.0   | 2026-04-03 | 初始版本，明确NestJS技术栈适配，完善Skills与Tools的核心定义、适用范围                                                           | XXX    |
| V1.1   | 2026-04-03 | 完善NestJS模块结构、Skills与Tools的注册规范、调度逻辑及异常处理，新增已有后端接口转发逻辑，重点实现AI聊天接口的Skills/Tools调用 | XXX    |
| V1.2   | 2026-04-03 | 根据实际前端和后端项目结构更新接口路径、参数和实现细节，确保文档与实际项目一致                                                  | XXX    |

# 2. Node中间层（NestJS）整体架构（接口转发+Skills/Tools）

## 2.1 架构设计（基于NestJS）

Node中间层基于NestJS的模块化思想，将Skills与Tools模块、接口转发模块独立封装，依托NestJS的依赖注入、模块拆分特性，实现高内聚、低耦合，核心架构分层如下（聚焦接口转发、Skills与Tools相关）：

- 核心模块（AiModule）：NestJS根模块下的核心业务模块，统一管理Skills与Tools相关的所有子模块、服务、接口，负责模块注册与依赖注入。

- 工具模块（ToolsModule）：NestJS子模块，负责所有Tool的注册、管理，封装Tool相关的Service、数据模型（DTO）、异常处理，提供Tool执行的统一入口。

- 技能模块（SkillsModule）：NestJS子模块，依赖ToolsModule，负责所有Skill的注册、管理，封装Skill的编排逻辑、执行流程，实现Tool的组合调用。

- 接口转发模块（ApiProxyModule）：NestJS子模块，负责接收外部请求，完成参数校验、权限校验，转发请求至已有后端接口，接收后端响应并标准化返回，核心适配用户提供的所有接口。

- AI聊天处理模块（ChatProcessModule）：依赖SkillsModule、ToolsModule、ApiProxyModule，负责在AI聊天接口转发过程中，解析请求/响应，触发Skills/Tools调用，整合执行结果。

- 接口控制器层（Controllers）：包含AuthController、AiController、FileController，对应用户提供的三类接口，负责接收外部请求，分发至对应Service处理。

- 公共模块（CommonModule）：提供通用工具类、异常过滤器、日志拦截器、参数校验管道等，为所有模块提供支撑，统一处理异常、日志、参数校验。

## 2.2 核心职责（仅Node中间层）

1. Skills与Tools的模块化管理：基于NestJS模块特性，实现Skills与Tools的注册、注销、按需加载，依托依赖注入机制实现Service复用。

2. Tool执行与Skill编排：接收调用指令，通过NestJS依赖注入实例化对应Tool/Skill，执行具体逻辑，返回标准化结果。

3. 接口转发：对用户提供的所有后端接口进行转发，完成请求校验、透传，响应标准化处理，不干预后端核心业务逻辑。

4. AI聊天接口Skills/Tools集成：在AI聊天接口转发过程中，解析请求内容判断是否需要调用Skills/Tools，或解析后端返回的工具调用指令执行对应逻辑，整合结果后完成转发/响应。

5. 参数校验与安全处理：通过NestJS管道（Pipe）实现对外部请求参数的校验，确保参数合法，避免非法请求触发后端异常。

6. 异常统一处理：通过NestJS过滤器（Filter）捕获所有异常（接口转发异常、Skills/Tools执行异常），返回标准化错误响应，记录详细日志。

7. 日志记录：通过NestJS拦截器（Interceptor）记录接口转发日志、Skills/Tools调用日志、执行结果、异常信息，便于问题排查与监控。

# 3. Tools模块规范（NestJS实现）

## 3.1 设计原则

- 单一职责：每个Tool仅负责一个具体业务功能（如数据查询、接口调用、文件解析），避免功能冗余，便于维护与复用，对应NestJS中的单个Service。

- 依赖注入兼容：所有Tool均基于NestJS Service实现，通过@Injectable()装饰器标记，支持NestJS依赖注入，可被Skill Service、AI聊天处理模块或Controller注入调用。

- 输入输出标准化：每个Tool需定义明确的输入DTO（Data Transfer Object）和输出DTO，通过NestJS的class-validator实现参数校验，确保输入合法、输出统一，适配AI聊天接口的调用场景。

- 异常可控：Tool内部需捕获业务异常，通过NestJS的自定义异常类抛出，由全局异常过滤器统一处理，避免影响接口转发流程。

- 可扩展性：Tool的实现需独立于具体业务场景，预留扩展接口，支持后续功能迭代，同时适配NestJS的模块扩展特性，可灵活集成至AI聊天接口。

## 3.2 注册规范（NestJS模块化）

### 3.2.1 模块注册

所有Tool相关的Service、DTO、异常类均封装在ToolsModule中，ToolsModule注册到AiModule中，同时导出供SkillsModule、AI聊天处理模块使用，示例代码如下（NestJS TypeScript）：

```typescript
// src/ai/tools/tools.module.ts
import { Module } from "@nestjs/common";
import { GetUserInfoTool } from "./services/get-user-info.tool";
import { GetOrderListTool } from "./services/get-order-list.tool";
import { FileParseTool } from "./services/file-parse.tool"; // 适配文件接口的工具
import { CommonModule } from "../../common/common.module";

@Module({
  imports: [CommonModule], // 引入公共模块（日志、异常处理等）
  providers: [GetUserInfoTool, GetOrderListTool, FileParseTool], // 注册所有Tool Service
  exports: [GetUserInfoTool, GetOrderListTool, FileParseTool], // 导出Tool Service，供其他模块使用
})
export class ToolsModule {}

// src/ai/ai.module.ts（根模块）
import { Module } from "@nestjs/common";
import { ToolsModule } from "./tools/tools.module";
import { SkillsModule } from "./skills/skills.module";
import { ApiProxyModule } from "./api-proxy/api-proxy.module";
import { ChatProcessModule } from "./chat-process/chat-process.module";

@Module({
  imports: [ToolsModule, SkillsModule, ApiProxyModule, ChatProcessModule], // 引入所有核心子模块
})
export class AiModule {}
```

### 3.2.2 Tool Service实现规范

每个Tool对应一个NestJS Service，通过@Injectable()装饰器标记，实现execute方法（核心执行逻辑），同时定义输入DTO和输出DTO，示例如下（适配AI聊天接口调用场景）：

```typescript
// 1. 输入DTO（参数校验）
// src/ai/tools/dto/get-user-info.input.ts
import { IsString, IsNotEmpty } from "class-validator";

export class GetUserInfoInput {
  @IsString({ message: "userId必须为字符串" })
  @IsNotEmpty({ message: "userId不能为空" })
  userId: string;
}

// 2. 输出DTO（统一返回格式）
// src/ai/tools/dto/get-user-info.output.ts
export class GetUserInfoOutput {
  userId: string;
  name: string;
  phone: string;
  createTime: string;
}

// 3. Tool Service实现
// src/ai/tools/services/get-user-info.tool.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { GetUserInfoInput } from "../dto/get-user-info.input";
import { GetUserInfoOutput } from "../dto/get-user-info.output";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { LoggerService } from "../../../common/services/logger.service";

@Injectable() // 标记为NestJS可注入Service
export class GetUserInfoTool {
  // 注入依赖（HttpService用于调用外部接口，LoggerService用于日志记录）
  constructor(
    private readonly httpService: HttpService,
    private readonly loggerService: LoggerService,
  ) {}

  // 核心执行方法，统一命名为execute，参数为输入DTO，返回为输出DTO
  async execute(input: GetUserInfoInput): Promise<GetUserInfoOutput> {
    try {
      this.loggerService.info(`GetUserInfoTool执行，userId: ${input.userId}`);
      // 调用外部业务接口（示例，可根据实际后端接口调整）
      const response = await firstValueFrom(
        this.httpService.get(`/api/user/${input.userId}`, {
          headers: { Authorization: `Bearer ${process.env.EXTERNAL_TOKEN}` },
        }),
      );
      // 校验接口返回结果
      if (!response.data || !response.data.success) {
        throw new NotFoundException("用户信息查询失败");
      }
      // 转换为输出DTO并返回（适配AI聊天接口的结果整合需求）
      const result: GetUserInfoOutput = {
        userId: response.data.data.userId,
        name: response.data.data.name,
        phone: response.data.data.phone,
        createTime: response.data.data.createTime,
      };
      this.loggerService.info(
        `GetUserInfoTool执行成功，userId: ${input.userId}`,
      );
      return result;
    } catch (error) {
      this.loggerService.error(
        `GetUserInfoTool执行失败，userId: ${input.userId}，错误：${error.message}`,
      );
      // 抛出NestJS标准异常，由全局异常过滤器处理
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error("GetUserInfoTool执行异常，请联系管理员");
    }
  }
}
```

### 3.2.3 Tool命名规范

- Service类名：[功能描述]Tool，如GetUserInfoTool、GetOrderListTool、FileParseTool，首字母大写，后缀统一为Tool。

- DTO类名：[功能描述]Input/[功能描述]Output，如GetUserInfoInput、GetUserInfoOutput，区分输入输出。

- 文件目录：所有Tool相关文件统一放在src/ai/tools目录下，按功能拆分文件夹（services、dto、exceptions），结构如下：
  `src/ai/tools/
├── dto/                // 输入输出DTO
│   ├── get-user-info.input.ts
│   ├── get-user-info.output.ts
│   └── ...
├── services/           // Tool Service实现
│   ├── get-user-info.tool.ts
│   ├── get-order-list.tool.ts
│   └── ...
├── exceptions/         // Tool相关异常类
│   ├── tool-execution.exception.ts
│   └── ...
└── tools.module.ts     // Tools模块注册
       `

# 4. Skills模块规范（NestJS实现）

## 4.1 设计原则

- 场景化封装：每个Skill对应一个具体业务场景，由单个或多个Tool组合构成，如“用户信息查询+订单汇总”“文件解析+内容提取”，适配AI聊天接口的实际调用场景。

- 依赖Tools：Skill不实现具体业务逻辑，仅负责Tool的调度、参数传递、结果整合，所有具体业务逻辑均由Tool实现，依托NestJS依赖注入注入Tool Service。

- 输入输出标准化：与Tool一致，Skill需定义输入DTO和输出DTO，支持NestJS参数校验，确保可被AI聊天接口灵活调用。

- 流程可配置：Skill的Tool执行顺序、参数传递规则可配置，支持灵活调整，适配不同AI聊天场景的迭代需求。

- 模块化管理：基于NestJS SkillsModule实现Skill的注册与管理，支持依赖注入，可被AI聊天处理模块或Controller调用。

## 4.2 注册规范（NestJS模块化）

### 4.2.1 模块注册

所有Skill相关的Service、DTO、异常类均封装在SkillsModule中，SkillsModule依赖ToolsModule（注入Tool Service），注册到AiModule中，同时导出供AI聊天处理模块使用，示例代码如下：

```typescript
// src/ai/skills/skills.module.ts
import { Module } from "@nestjs/common";
import { ToolsModule } from "../tools/tools.module";
import { UserInfoWithOrderSkill } from "./services/user-info-with-order.skill";
import { FileParseAndExtractSkill } from "./services/file-parse-and-extract.skill"; // 适配文件接口的技能
import { CommonModule } from "../../common/common.module";

@Module({
  imports: [ToolsModule, CommonModule], // 依赖ToolsModule，注入Tool Service
  providers: [UserInfoWithOrderSkill, FileParseAndExtractSkill], // 注册所有Skill Service
  exports: [UserInfoWithOrderSkill, FileParseAndExtractSkill], // 导出Skill Service，供其他模块使用
})
export class SkillsModule {}
```

### 4.2.2 Skill Service实现规范

每个Skill对应一个NestJS Service，通过@Injectable()装饰器标记，注入所需的Tool Service，实现execute方法（核心编排逻辑），定义输入输出DTO，示例如下（多Tool组合场景，适配AI聊天接口调用）：

```typescript
// 1. 输入DTO
// src/ai/skills/dto/user-info-with-order.input.ts
import { IsString, IsNotEmpty, IsNumber, Min } from "class-validator";

export class UserInfoWithOrderInput {
  @IsString({ message: "userId必须为字符串" })
  @IsNotEmpty({ message: "userId不能为空" })
  userId: string;

  @IsNumber({}, { message: "page必须为数字" })
  @Min(1, { message: "page不能小于1" })
  page: number = 1;

  @IsNumber({}, { message: "pageSize必须为数字" })
  @Min(1, { message: "pageSize不能小于1" })
  pageSize: number = 10;
}

// 2. 输出DTO
// src/ai/skills/dto/user-info-with-order.output.ts
import { GetUserInfoOutput } from "../../tools/dto/get-user-info.output";
import { GetOrderListOutput } from "../../tools/dto/get-order-list.output";

export class UserInfoWithOrderOutput {
  userInfo: GetUserInfoOutput; // 复用Tool的输出DTO
  orderList: GetOrderListOutput[];
  total: number; // 订单总数
  page: number;
  pageSize: number;
}

// 3. Skill Service实现（组合GetUserInfoTool和GetOrderListTool）
// src/ai/skills/services/user-info-with-order.skill.ts
import { Injectable } from "@nestjs/common";
import { UserInfoWithOrderInput } from "../dto/user-info-with-order.input";
import { UserInfoWithOrderOutput } from "../dto/user-info-with-order.output";
import { GetUserInfoTool } from "../../tools/services/get-user-info.tool";
import { GetOrderListTool } from "../../tools/services/get-order-list.tool";
import { LoggerService } from "../../../common/services/logger.service";

@Injectable()
export class UserInfoWithOrderSkill {
  // 注入所需的Tool Service（依赖注入）
  constructor(
    private readonly getUserInfoTool: GetUserInfoTool,
    private readonly getOrderListTool: GetOrderListTool,
    private readonly loggerService: LoggerService,
  ) {}

  // 核心执行方法，编排两个Tool的执行顺序，整合结果（适配AI聊天接口返回格式）
  async execute(
    input: UserInfoWithOrderInput,
  ): Promise<UserInfoWithOrderOutput> {
    this.loggerService.info(
      `UserInfoWithOrderSkill执行，userId: ${input.userId}`,
    );
    // 1. 先执行GetUserInfoTool，获取用户信息
    const userInfo = await this.getUserInfoTool.execute({
      userId: input.userId,
    });
    // 2. 再执行GetOrderListTool，获取用户订单列表
    const { orderList, total } = await this.getOrderListTool.execute({
      userId: input.userId,
      page: input.page,
      pageSize: input.pageSize,
    });
    // 3. 整合两个Tool的结果，返回Skill输出DTO（便于AI聊天接口整合至响应）
    const result: UserInfoWithOrderOutput = {
      userInfo,
      orderList,
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
    this.loggerService.info(
      `UserInfoWithOrderSkill执行成功，userId: ${input.userId}`,
    );
    return result;
  }
}
```

### 4.2.3 Skill命名规范

- Service类名：[场景描述]Skill，如UserInfoWithOrderSkill、FileParseAndExtractSkill，首字母大写，后缀统一为Skill。

- DTO类名：[场景描述]Input/[场景描述]Output，如UserInfoWithOrderInput、UserInfoWithOrderOutput，区分输入输出。

- 文件目录：所有Skill相关文件统一放在src/ai/skills目录下，按功能拆分文件夹（services、dto、exceptions），结构如下：
  `src/ai/skills/
├── dto/                // 输入输出DTO
│   ├── user-info-with-order.input.ts
│   ├── user-info-with-order.output.ts
│   └── ...
├── services/           // Skill Service实现
│   ├── user-info-with-order.skill.ts
│   ├── file-parse-and-extract.skill.ts
│   └── ...
├── exceptions/         // Skill相关异常类
│   ├── skill-execution.exception.ts
│   └── ...
└── skills.module.ts     // Skills模块注册
       `

# 5. 接口转发规范（NestJS实现，适配用户提供的所有接口）

## 5.1 转发核心原则

- 透传为主：Node中间层仅负责请求转发、参数校验、权限校验（如需）、响应标准化，不修改后端接口的核心业务参数和响应数据。

- 异常隔离：接口转发过程中出现的异常（如后端接口不可用、请求超时），由Node中间层统一捕获处理，不将后端原始异常直接返回给外部。

- AI聊天接口特殊处理：仅在POST /api/ai/chat接口中，融入Skills与Tools调用逻辑，其他接口均为纯转发。

- NestJS适配：基于NestJS的HttpService实现请求转发，通过Interceptor记录转发日志，通过Filter处理转发异常，通过Pipe校验请求参数。

## 5.2 接口转发实现（NestJS Service）

通过ApiProxyService实现所有接口的统一转发逻辑，注入HttpService，封装转发方法，适配不同请求方式（GET、POST、PUT、DELETE），示例代码如下：

```typescript
// src/ai/api-proxy/services/api-proxy.service.ts
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { LoggerService } from "../../../common/services/logger.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ApiProxyService {
  // 后端接口基础地址（从环境变量获取）
  private readonly backendBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.backendBaseUrl =
      this.configService.get("BACKEND_BASE_URL") || "http://localhost:8080";
  }

  // 统一转发方法
  private async proxyRequest(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    data?: any,
    params?: any,
  ) {
    try {
      this.loggerService.info(
        `接口转发：${method} ${this.backendBaseUrl}${path}，参数：${JSON.stringify(data)}，查询参数：${JSON.stringify(params)}`,
      );
      // 构建请求配置
      const requestConfig = {
        url: `${this.backendBaseUrl}${path}`,
        method,
        data,
        params,
        headers: {
          "Content-Type": "application/json",
          // 传递token（如需）
          Authorization: data?.token || params?.token || "",
        },
      };
      // 发送请求并获取响应
      const response = await firstValueFrom(
        this.httpService.request(requestConfig),
      );
      this.loggerService.info(`接口转发成功：${method} ${path}`);
      // 标准化响应格式（与后端响应兼容，统一返回code、message、data）
      return {
        code: 200,
        message: "请求成功",
        data: response.data,
      };
    } catch (error) {
      this.loggerService.error(
        `接口转发失败：${method} ${path}，错误信息：${error.message}`,
      );
      // 统一处理转发异常
      throw new HttpException(
        {
          code: error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            error.response?.data?.message || "接口转发异常，请联系管理员",
          data: null,
        },
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 认证接口转发
  async authLogin(data: any) {
    return this.proxyRequest("POST", "/auth/login", data);
  }

  async authLogout() {
    return this.proxyRequest("POST", "/auth/logout");
  }

  // 用户接口转发
  async getUserInfo() {
    return this.proxyRequest("GET", "/user/info");
  }

  // AI聊天接口转发（单独封装，用于集成Skills/Tools调用）
  async aiChat(data: any) {
    // 此处暂不实现转发，后续在ChatProcessService中集成Skills/Tools后再转发
    return data;
  }

  // 其他AI接口转发
  async createAiSession(data: any) {
    return this.proxyRequest("POST", "/ai/session/create", data);
  }

  async getAiSessions() {
    return this.proxyRequest("GET", "/ai/session/list");
  }

  async getAiChatHistory(params: any) {
    return this.proxyRequest("GET", "/ai/chat/history", null, params);
  }

  async deleteAiSession(sessionId: string) {
    return this.proxyRequest("DELETE", `/ai/session/${sessionId}`);
  }

  async getAiConfig() {
    return this.proxyRequest("GET", "/ai/config");
  }

  // 文件接口转发
  async fileUpload(data: any) {
    return this.proxyRequest("POST", "/file/upload", data);
  }
}
```

## 5.3 各接口详细规范（转发+AI聊天接口Skills/Tools调用）

### 5.3.1 认证接口（纯转发）

#### 1. POST /auth/login - 用户登录

接口描述：Node中间层接收用户登录请求，校验参数后转发至后端登录接口，接收后端响应（如token）后标准化返回。

##### 请求参数（body）

| 参数名   | 类型   | 是否必传 | 描述                       | 示例        |
| -------- | ------ | -------- | -------------------------- | ----------- |
| username | string | 是       | 用户名/邮箱                | "zhangsan"  |
| password | string | 是       | 密码（加密前，透传至后端） | "123456Aa!" |

##### 响应参数（标准化）

| 参数名  | 类型   | 描述                                | 示例                                                                                             |
| ------- | ------ | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| code    | number | 状态码                              | 200                                                                                              |
| message | string | 响应描述                            | "登录成功"                                                                                       |
| data    | object | 后端返回的登录结果（透传，含token） | {"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "userId": "123456", "username": "zhangsan"} |

#### 2. POST /auth/logout - 用户登出

接口描述：Node中间层接收用户登出请求，转发至后端登出接口，标准化响应后返回。

##### 请求参数

无特殊参数，依赖请求头中的token进行身份验证。

##### 响应参数（标准化）

| 参数名  | 类型   | 描述     | 示例       |
| ------- | ------ | -------- | ---------- |
| code    | number | 状态码   | 200        |
| message | string | 响应描述 | "登出成功" |
| data    | object | 响应数据 | null       |

#### 3. GET /user/info - 获取用户信息

接口描述：Node中间层接收获取用户信息请求，转发至后端用户信息接口，标准化响应后返回。

##### 请求参数

无特殊参数，依赖请求头中的token进行身份验证。

##### 响应参数（标准化）

| 参数名  | 类型   | 描述     | 示例                                                                      |
| ------- | ------ | -------- | ------------------------------------------------------------------------- |
| code    | number | 状态码   | 200                                                                       |
| message | string | 响应描述 | "获取用户信息成功"                                                        |
| data    | object | 用户信息 | {"userId": "123456", "username": "zhangsan", "email": "zhangsan@xxx.com"} |

### 5.3.2 AI接口（纯转发+chat接口Skills/Tools调用）

#### 1. GET /ai/config - 获取AI配置

接口描述：纯转发接口，Node中间层接收请求后，转发至后端获取AI配置接口，标准化响应后返回。

##### 请求参数

无特殊参数，依赖请求头中的token进行身份验证。

##### 响应参数（标准化）

| 参数名  | 类型   | 描述                     | 示例                                                    |
| ------- | ------ | ------------------------ | ------------------------------------------------------- |
| code    | number | 状态码                   | 200                                                     |
| message | string | 响应描述                 | "获取AI配置成功"                                        |
| data    | object | 后端返回的AI配置（透传） | {"model": "xxx", "temperature": 0.7, "maxTokens": 2048} |

#### 2. POST /ai/session/create - 创建会话

接口描述：纯转发接口，Node中间层接收会话创建请求，校验参数后转发至后端创建会话接口，标准化响应后返回。

##### 请求参数（body）

| 参数名 | 类型   | 是否必传 | 描述     | 示例          |
| ------ | ------ | -------- | -------- | ------------- |
| title  | string | 否       | 会话标题 | "AI聊天会话1" |

##### 响应参数（标准化）

| 参数名  | 类型   | 描述     | 示例                                                                                  |
| ------- | ------ | -------- | ------------------------------------------------------------------------------------- |
| code    | number | 状态码   | 200                                                                                   |
| message | string | 响应描述 | "创建成功"                                                                            |
| data    | object | 会话信息 | {"sessionId": "123456", "title": "AI聊天会话1", "createTime": "2026-04-03T12:00:00Z"} |

#### 3. GET /ai/session/list - 获取会话列表

接口描述：纯转发接口，Node中间层接收请求后，转发至后端获取会话列表接口，标准化响应后返回。

##### 请求参数

无特殊参数，依赖请求头中的token进行身份验证。

##### 响应参数（标准化）

| 参数名  | 类型   | 描述     | 示例                                                                                    |
| ------- | ------ | -------- | --------------------------------------------------------------------------------------- |
| code    | number | 状态码   | 200                                                                                     |
| message | string | 响应描述 | "获取会话列表成功"                                                                      |
| data    | array  | 会话列表 | [{"sessionId": "123456", "title": "AI聊天会话1", "createTime": "2026-04-03T12:00:00Z"}] |

#### 4. GET /ai/chat/history - 获取聊天历史

接口描述：纯转发接口，Node中间层接收请求（携带会话ID），转发至后端获取聊天历史接口，标准化响应后返回。

##### 请求参数（query）

| 参数名    | 类型   | 是否必传 | 描述   | 示例     |
| --------- | ------ | -------- | ------ | -------- |
| sessionId | string | 是       | 会话ID | "123456" |

##### 响应参数（标准化）

| 参数名  | 类型   | 描述     | 示例                                                                                                            |
| ------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------- |
| code    | number | 状态码   | 200                                                                                                             |
| message | string | 响应描述 | "获取聊天历史成功"                                                                                              |
| data    | object | 聊天历史 | {"sessionId": "123456", "messages": [{"role": "user", "content": "你好", "timestamp": "2026-04-03T12:00:00Z"}]} |

#### 5. DELETE /ai/session/{sessionId} - 删除会话

接口描述：纯转发接口，Node中间层接收请求（携带会话ID），转发至后端删除会话接口，标准化响应后返回。

##### 请求参数

- 路径参数：sessionId（会话ID，必传），示例：/ai/session/123456

##### 响应参数（标准化）

| 参数名  | 类型   | 描述     | 示例       |
| ------- | ------ | -------- | ---------- |
| code    | number | 状态码   | 200        |
| message | string | 响应描述 | "删除成功" |
| data    | object | 响应数据 | null       |

#### 6. POST /ai/chat - 发送聊天消息（核心，集成Skills/Tools调用）

接口描述：Node中间层接收聊天消息请求后，先解析消息内容，判断是否需要调用Skills或Tools，执行对应逻辑后，将聊天消息与工具/技能执行结果一同转发至后端AI接口；接收后端返回的响应（含工具调用指令时），执行对应Skills/Tools，整合结果后返回给外部，实现“聊天消息+Skills/Tools调用”的联动。

##### 核心流程

1. Node中间层接收聊天请求（含消息内容、会话ID、用户ID等）。

2. 解析消息内容，判断是否需要调用Skills/Tools（可通过关键词匹配、后端预设规则等方式）。

3. 如需调用，通过ChatProcessService调度对应Skill/Tool，执行并获取结果。

4. 将原始聊天消息与Skill/Tool执行结果整合，转发至后端AI接口。

5. 接收后端AI接口响应，判断是否包含工具调用指令。

6. 如包含工具调用指令，调度对应Skill/Tool执行，将执行结果回传给后端，获取最终AI响应。

7. 将最终AI响应标准化后，返回给外部。

##### 请求参数（body）

| 参数名    | 类型    | 是否必传 | 描述         | 示例                     |
| --------- | ------- | -------- | ------------ | ------------------------ |
| sessionId | string  | 否       | 会话ID       | "123456"                 |
| message   | string  | 是       | 聊天消息内容 | "你好，帮我查询一下天气" |
| stream    | boolean | 否       | 是否流式返回 | true                     |

### 5.3.3 文件接口（纯转发）

#### 1. POST /file/upload - 文件上传

接口描述：Node中间层接收文件上传请求，校验参数后转发至后端文件上传接口，标准化响应后返回。

##### 请求参数（form-data）

| 参数名 | 类型 | 是否必传 | 描述       | 示例           |
| ------ | ---- | -------- | ---------- | -------------- |
| file   | file | 是       | 上传的文件 | 二进制文件数据 |

##### 响应参数（标准化）

| 参数名  | 类型   | 描述         | 示例                                                                                          |
| ------- | ------ | ------------ | --------------------------------------------------------------------------------------------- |
| code    | number | 状态码       | 200                                                                                           |
| message | string | 响应描述     | "上传成功"                                                                                    |
| data    | object | 文件上传结果 | {"fileId": "123456", "fileName": "example.txt", "fileUrl": "http://example.com/files/123456"} |

> （注：文档部分内容可能由 AI 生成）
