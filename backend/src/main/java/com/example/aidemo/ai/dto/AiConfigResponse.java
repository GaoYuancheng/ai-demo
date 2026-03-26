package com.example.aidemo.ai.dto;

import lombok.Data;

import java.util.List;

/**
 * AI配置响应DTO
 */
@Data
public class AiConfigResponse {

    private List<String> modelList;
    private Integer maxTokens;
    private Double temperature;
}
