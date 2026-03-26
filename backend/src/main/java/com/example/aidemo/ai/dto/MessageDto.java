package com.example.aidemo.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 消息DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {

    private String role;
    private String content;
    private LocalDateTime createTime;
}
