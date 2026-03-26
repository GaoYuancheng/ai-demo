package com.example.aidemo.ai.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.aidemo.ai.entity.AiMessage;
import org.apache.ibatis.annotations.Mapper;

/**
 * AI消息Mapper接口
 */
@Mapper
public interface AiMessageMapper extends BaseMapper<AiMessage> {
}
