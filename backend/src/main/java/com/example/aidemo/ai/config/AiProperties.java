package com.example.aidemo.ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * AI配置属性类
 */
@Data
@Component
@ConfigurationProperties(prefix = "ai")
public class AiProperties {

    private String apiKey;
    private String baseUrl;
    private Integer timeout;
    private String defaultModel;
    private Integer maxTokens;
    private Double temperature;
    private List<String> modelList;
}
