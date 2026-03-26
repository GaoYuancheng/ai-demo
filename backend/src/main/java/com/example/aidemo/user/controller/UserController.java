package com.example.aidemo.user.controller;

import com.example.aidemo.auth.dto.UserInfoResponse;
import com.example.aidemo.auth.service.AuthService;
import com.example.aidemo.common.Result;
import com.example.aidemo.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户控制器
 */
@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

    @GetMapping("/info")
    public Result<UserInfoResponse> getUserInfo(@CurrentUser Long userId) {
        UserInfoResponse response = authService.getUserInfo(userId);
        return Result.success(response);
    }
}
