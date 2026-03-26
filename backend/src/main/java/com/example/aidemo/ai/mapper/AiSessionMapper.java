package com.example.aidemo.ai.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.aidemo.ai.entity.AiSession;
import org.apache.ibatis.annotations.Mapper;

/**
 * AI会话Mapper接口
 */
@Mapper
public interface AiSessionMapper extends BaseMapper<AiSession> {
}
