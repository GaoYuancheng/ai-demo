package com.example.aidemo.auth.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户信息DTO
 */
@Data
public class UserInfoResponse {

    private Long userId;
    private String username;
    private String role;
    private LocalDateTime createTime;
}
