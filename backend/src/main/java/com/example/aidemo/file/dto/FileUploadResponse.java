package com.example.aidemo.file.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 文件上传响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {

    private String fileUrl;
    private String fileName;
    private Long fileSize;
}
