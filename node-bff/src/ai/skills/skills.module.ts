import { Module } from '@nestjs/common';
import { ToolsModule } from '../tools/tools.module';
import { UserInfoWithOrderSkill } from './services/user-info-with-order.skill';

/**
 * 技能模块
 * 负责所有Skill的注册、管理，依赖ToolsModule
 */
@Module({
  imports: [ToolsModule],
  providers: [
    UserInfoWithOrderSkill,
  ],
  exports: [
    UserInfoWithOrderSkill,
  ],
})
export class SkillsModule {}