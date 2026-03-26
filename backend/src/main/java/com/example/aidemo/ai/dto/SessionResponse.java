package com.example.aidemo.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 会话响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {

    private String sessionId;
    private String title;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
