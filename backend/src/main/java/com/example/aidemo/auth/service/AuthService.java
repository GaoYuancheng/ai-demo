package com.example.aidemo.auth.service;

import cn.hutool.crypto.digest.DigestUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aidemo.auth.dto.CreateUserRequest;
import com.example.aidemo.auth.dto.LoginRequest;
import com.example.aidemo.auth.dto.LoginResponse;
import com.example.aidemo.auth.dto.UserInfoResponse;
import com.example.aidemo.auth.entity.User;
import com.example.aidemo.auth.mapper.UserMapper;
import com.example.aidemo.auth.util.JwtUtil;
import com.example.aidemo.common.BusinessException;
import com.example.aidemo.common.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 认证服务类
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, request.getUsername());
        User user = userMapper.selectOne(wrapper);

        if (user == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "用户名或密码错误");
        }

        String encryptedPassword = DigestUtil.md5Hex(request.getPassword());
        if (!encryptedPassword.equals(user.getPassword())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "用户名或密码错误");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

        return new LoginResponse(token, user.getId(), user.getUsername());
    }

    public void logout(String token) {
    }

    public UserInfoResponse getUserInfo(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "用户不存在");
        }

        UserInfoResponse response = new UserInfoResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setRole(user.getRole());
        response.setCreateTime(user.getCreateTime());
        return response;
    }

    /**
     * 创建用户
     * @param request 创建用户请求
     * @return 用户信息响应
     */
    public UserInfoResponse createUser(CreateUserRequest request) {
        // 检查用户名是否已存在
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, request.getUsername());
        User existingUser = userMapper.selectOne(wrapper);
        System.out.println(existingUser);
        if (existingUser != null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "用户名已存在");
        }

        // 创建新用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(DigestUtil.md5Hex(request.getPassword()));
        user.setRole(request.getRole() != null ? request.getRole() : "user");
        user.setCreateTime(java.time.LocalDateTime.now());
        user.setUpdateTime(java.time.LocalDateTime.now());
        user.setDeleted(0);

        userMapper.insert(user);

        // 返回用户信息
        UserInfoResponse response = new UserInfoResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setRole(user.getRole());
        response.setCreateTime(user.getCreateTime());
        return response;
    }
}
