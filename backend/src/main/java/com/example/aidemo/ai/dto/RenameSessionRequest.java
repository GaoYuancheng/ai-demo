package com.example.aidemo.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 重命名会话请求DTO
 */
@Data
public class RenameSessionRequest {

    @NotBlank(message = "会话标题不能为空")
    private String title;
}
