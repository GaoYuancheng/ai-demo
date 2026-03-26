package com.example.aidemo.security;

import java.lang.annotation.*;

/**
 * 当前登录用户注解
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface CurrentUser {
}
