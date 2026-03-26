package com.example.aidemo.ai.dto;

import lombok.Data;

/**
 * 更新AI配置请求DTO
 */
@Data
public class UpdateAiConfigRequest {

    private String model;
    private Integer maxTokens;
    private Double temperature;
}
