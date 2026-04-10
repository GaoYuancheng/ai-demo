import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 业务异常基类
 */
export class BusinessException extends HttpException {
  constructor(message: string, code: number = HttpStatus.INTERNAL_SERVER_ERROR, data: any = null) {
    super(
      {
        code,
        message,
        data,
      },
      code,
    );
  }
}

/**
 * 工具执行异常
 */
export class ToolExecutionException extends BusinessException {
  constructor(toolName: string, message: string) {
    super(`Tool [${toolName}] 执行失败: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * 技能执行异常
 */
export class SkillExecutionException extends BusinessException {
  constructor(skillName: string, message: string) {
    super(`Skill [${skillName}] 执行失败: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * 接口转发异常
 */
export class ProxyException extends BusinessException {
  constructor(targetUrl: string, message: string, code?: number) {
    super(`接口转发失败 [${targetUrl}]: ${message}`, code || HttpStatus.BAD_GATEWAY);
  }
}