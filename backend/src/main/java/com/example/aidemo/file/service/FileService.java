package com.example.aidemo.file.service;

import com.example.aidemo.common.BusinessException;
import com.example.aidemo.common.ErrorCode;
import com.example.aidemo.file.dto.FileUploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 文件服务类
 */
@Service
public class FileService {

    @Value("${file.upload-path:./uploads}")
    private String uploadPath;

    public FileUploadResponse uploadFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "上传文件不能为空");
        }

        try {
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String newFileName = UUID.randomUUID().toString().replace("-", "") + extension;

            Path dirPath = Paths.get(uploadPath, datePath);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }

            Path filePath = dirPath.resolve(newFileName);
            file.transferTo(filePath.toFile());

            String fileUrl = "/files/" + datePath + "/" + newFileName;

            return new FileUploadResponse(fileUrl, originalFilename, file.getSize());
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "文件上传失败: " + e.getMessage());
        }
    }
}
