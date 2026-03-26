package com.example.aidemo.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * AI对话请求DTO
 */
@Data
public class ChatRequest {

    private String sessionId;

    @NotBlank(message = "消息内容不能为空")
    private String message;

    private String model;

    private Boolean stream = false;
}
