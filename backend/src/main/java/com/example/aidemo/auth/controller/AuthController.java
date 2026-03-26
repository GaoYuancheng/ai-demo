package com.example.aidemo.auth.controller;

import com.example.aidemo.auth.dto.CreateUserRequest;
import com.example.aidemo.auth.dto.LoginRequest;
import com.example.aidemo.auth.dto.LoginResponse;
import com.example.aidemo.auth.service.AuthService;
import com.example.aidemo.common.Result;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return Result.success("登录成功", response);
    }

    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader("Authorization") String authorization) {
        String token = authorization.replace("Bearer ", "");
        authService.logout(token);
        return Result.success("登出成功", null);
    }

    @PostMapping("/register")
    public Result<?> register(@Valid @RequestBody CreateUserRequest request) {
        return Result.success("用户创建成功", authService.createUser(request));
    }
}
