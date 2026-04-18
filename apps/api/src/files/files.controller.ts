import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsNotEmpty, IsString } from 'class-validator';
import { FilesService } from './files.service';

class DeleteFileDto {
  @IsString()
  @IsNotEmpty()
  key!: string;
}

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'general',
  ) {
    if (!file) {
      throw new BadRequestException({ code: 'FILE_REQUIRED', message: '请选择上传文件' });
    }
    return this.filesService.upload(file, folder);
  }

  @Get('signed-url')
  async getSignedUrl(@Query('key') key: string) {
    return this.filesService.getSignedUrl(key);
  }

  @Delete()
  async delete(@Body() body: DeleteFileDto) {
    await this.filesService.delete(body.key);
    return { key: body.key };
  }
}
