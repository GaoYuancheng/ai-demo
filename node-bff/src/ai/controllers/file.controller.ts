import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiProxyService } from '../api-proxy/services/api-proxy.service';

/**
 * 文件控制器
 * 负责处理文件上传等接口
 */
@Controller('file')
export class FileController {
  constructor(private readonly apiProxyService: ApiProxyService) {}

  /**
   * 文件上传
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.apiProxyService.fileUpload({
      file: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });
  }
}