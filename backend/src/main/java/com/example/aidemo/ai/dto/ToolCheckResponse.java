package com.example.aidemo.ai.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 工具检查响应DTO
 * 用于第一次AI调用，判断是否需要工具调用
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToolCheckResponse {

    /**
     * 是否需要工具调用
     */
    private Boolean needsTools;

    /**
     * 工具调用信息（如果需要工具调用）
     */
    private JsonNode toolCalls;

    /**
     * AI响应内容（如果不需要工具调用）
     */
    private String content;
}
