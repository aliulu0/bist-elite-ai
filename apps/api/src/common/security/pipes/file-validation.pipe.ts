import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { AppLoggerService } from '../../logger/logger.service';
import { getSecurityConfig, SecurityConfig } from '../security.config';

const PATH_TRAVERSAL_REGEX = /(\.\.[\/\\])+|(\.\.)/;

interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly config: SecurityConfig['fileUpload'];

  constructor(private readonly logger: AppLoggerService) {
    this.config = getSecurityConfig().fileUpload;
  }

  transform(files: FileUpload | FileUpload[] | undefined): FileUpload | FileUpload[] | undefined {
    if (!files) return undefined;

    const fileArray = Array.isArray(files) ? files : [files];

    if (fileArray.length > this.config.maxFiles) {
      throw new BadRequestException({
        statusCode: 400,
        message: `En fazla ${this.config.maxFiles} dosya yükleyebilirsiniz.`,
        error: 'Bad Request',
      });
    }

    for (const file of fileArray) {
      this.validateFile(file);
    }

    return files;
  }

  private validateFile(file: FileUpload): void {
    if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
      this.logger.warn(
        `Invalid file type: ${file.mimetype} for ${file.originalname}`,
        'FileValidation',
        { filename: file.originalname, mimetype: file.mimetype },
      );
      throw new BadRequestException({
        statusCode: 400,
        message: `"${file.originalname}" dosya türü desteklenmiyor.`,
        error: 'Bad Request',
      });
    }

    if (file.size > this.config.maxFileSize) {
      this.logger.warn(
        `File too large: ${file.size} bytes for ${file.originalname}`,
        'FileValidation',
        { filename: file.originalname, size: file.size },
      );
      throw new BadRequestException({
        statusCode: 400,
        message: `"${file.originalname}" dosyası çok büyük. Maksimum boyut: ${this.formatBytes(this.config.maxFileSize)}.`,
        error: 'Bad Request',
      });
    }

    if (PATH_TRAVERSAL_REGEX.test(file.originalname)) {
      this.logger.warn(
        `Path traversal attempt detected: ${file.originalname}`,
        'FileValidation',
        { filename: file.originalname },
      );
      throw new BadRequestException({
        statusCode: 400,
        message: 'Geçersiz dosya adı.',
        error: 'Bad Request',
      });
    }

    if (file.originalname.includes('\0')) {
      this.logger.warn(`Null byte in filename: ${file.originalname}`, 'FileValidation', {
        filename: file.originalname,
      });
      throw new BadRequestException({
        statusCode: 400,
        message: 'Geçersiz dosya adı.',
        error: 'Bad Request',
      });
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
