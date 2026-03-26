package com.example.aidemo.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * AI对话响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {

    private String sessionId;
    private String requestId;
    private String aiReply;
    private LocalDateTime createTime;
}
