package com.example.aidemo.ai.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * AI会话实体类
 */
@Data
@TableName("ai_session")
public class AiSession {

    @TableId(type = IdType.ASSIGN_UUID)
    private String sessionId;

    private Long userId;

    private String title;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
