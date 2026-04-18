import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import OSS = require('ali-oss');

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(['certificates', 'documents', 'general']);

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private _ossClient: any;

  constructor(private readonly configService: ConfigService) {}

  private get ossClient(): any {
    if (!this._ossClient) {
      const region = this.getRequiredConfig('OSS_REGION');
      const accessKeyId = this.getRequiredConfig('OSS_ACCESS_KEY_ID');
      const accessKeySecret = this.getRequiredConfig('OSS_ACCESS_KEY_SECRET');
      const bucket = this.getRequiredConfig('OSS_BUCKET');
      try {
        this._ossClient = new OSS({ region, accessKeyId, accessKeySecret, bucket });
      } catch (error) {
        this.logger.error('Failed to initialize OSS client', error instanceof Error ? error.stack : String(error));
        throw new InternalServerErrorException({ code: 'OSS_INIT_FAILED', message: 'OSS 客户端初始化失败' });
      }
    }
    return this._ossClient;
  }

  async upload(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<{ key: string; filename: string; size: number }> {
    if (!file) {
      throw new BadRequestException({ code: 'FILE_REQUIRED', message: '请选择上传文件' });
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException({ code: 'INVALID_FILE_TYPE', message: '不支持的文件类型' });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException({ code: 'FILE_TOO_LARGE', message: '文件大小不能超过 50MB' });
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException({ code: 'FILE_EMPTY', message: '文件内容为空' });
    }

    const normalizedFolder = this.normalizeFolder(folder);
    const env = this.normalizeEnv(this.configService.get<string>('NODE_ENV'));
    const date = new Date().toISOString().slice(0, 7);
    const extension = extname(file.originalname || '').toLowerCase();
    const safeExt = extension || this.extensionFromMime(file.mimetype);
    const key = `${env}/${normalizedFolder}/${date}/${randomUUID()}${safeExt}`;

    try {
      await this.ossClient.put(key, file.buffer);
      return {
        key,
        filename: file.originalname,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(`OSS upload failed: ${key}`, error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException({ code: 'OSS_UPLOAD_FAILED', message: '文件上传失败' });
    }
  }

  async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    if (!key || !key.trim()) {
      throw new BadRequestException({ code: 'FILE_KEY_REQUIRED', message: '文件 key 不能为空' });
    }

    if (typeof expiresInSeconds !== 'number' || isNaN(expiresInSeconds)) {
      throw new BadRequestException({ code: 'INVALID_EXPIRES', message: '过期时间必须是有效的数字' });
    }

    const clampedExpires = Math.min(Math.max(expiresInSeconds, 60), 86400);

    try {
      return this.ossClient.signatureUrl(key.trim(), { expires: clampedExpires });
    } catch (error) {
      this.logger.error(`OSS signed url failed: ${key}`, error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException({
        code: 'OSS_SIGNED_URL_FAILED',
        message: '获取签名链接失败',
      });
    }
  }

  async delete(key: string): Promise<void> {
    if (!key || !key.trim()) {
      throw new BadRequestException({ code: 'FILE_KEY_REQUIRED', message: '文件 key 不能为空' });
    }

    const trimmedKey = key.trim();
    if (!this.isValidKeyFormat(trimmedKey)) {
      throw new BadRequestException({ code: 'INVALID_KEY_FORMAT', message: '文件 key 格式无效' });
    }

    try {
      await this.ossClient.delete(trimmedKey);
    } catch (error) {
      this.logger.error(`OSS delete failed: ${trimmedKey}`, error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException({ code: 'OSS_DELETE_FAILED', message: '文件删除失败' });
    }
  }

  private normalizeEnv(nodeEnv?: string): string {
    if (!nodeEnv) {
      return 'prod';
    }
    return nodeEnv.toLowerCase() === 'production' ? 'prod' : 'dev';
  }

  private normalizeFolder(folder?: string): string {
    const normalized = (folder || 'general').trim().toLowerCase();
    if (normalized.includes('..') || normalized.includes('/') || normalized.includes('\\')) {
      throw new BadRequestException({ code: 'INVALID_FOLDER', message: '不支持的文件夹类型' });
    }
    if (!ALLOWED_FOLDERS.has(normalized)) {
      throw new BadRequestException({ code: 'INVALID_FOLDER', message: '不支持的文件夹类型' });
    }
    return normalized;
  }

  private extensionFromMime(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'application/pdf':
        return '.pdf';
      default:
        return '.bin';
    }
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing required config: ${key}`);
    }
    return value;
  }

  private isValidKeyFormat(key: string): boolean {
    const keyPattern = /^(prod|dev)\/(certificates|documents|general)\/\d{4}-\d{2}\/[0-9a-f-]+\.(jpg|png|webp|pdf|bin)$/i;
    return keyPattern.test(key);
  }
}
