import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { ERROR_CODES } from '../constants/error-codes';
import { ApiException } from '../exceptions/api.exception';
import type { UploadedFile } from '../types/uploaded-file.type';

@Injectable()
export class S3UploadService {
  private readonly region: string;
  private readonly bucket: string;
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.region =
      this.configService.get<string>('AWS_S3_REGION') ?? 'ap-northeast-2';
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET') ?? '';
    this.s3Client = new S3Client({ region: this.region });
  }

  async uploadImage(file: UploadedFile, folder: string) {
    if (!this.bucket) {
      throw new ApiException(
        500,
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'S3 버킷 설정이 누락되었습니다.',
      );
    }

    const extension = extname(file.originalname || '') || '.png';
    const key = `${folder}/${Date.now()}-${randomUUID()}${extension}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
