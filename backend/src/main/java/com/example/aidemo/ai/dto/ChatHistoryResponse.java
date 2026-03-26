package com.example.aidemo.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 会话历史响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatHistoryResponse {

    private String sessionId;
    private String title;
    private List<MessageDto> messages;
}
