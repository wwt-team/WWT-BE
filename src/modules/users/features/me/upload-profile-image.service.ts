import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ApiException } from '../../../../common/exceptions/api.exception';
import { S3UploadService } from '../../../../common/services/s3-upload.service';
import type { RequestUser } from '../../../../common/types/request-user.type';
import type { UploadedFile } from '../../../../common/types/uploaded-file.type';
import { UsersService } from '../../users.service';

@Injectable()
export class UploadProfileImageService {
  constructor(
    private readonly usersService: UsersService,
    private readonly s3UploadService: S3UploadService,
  ) {}

  async upload(currentUser: RequestUser, file?: UploadedFile) {
    if (!file) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.MISSING_PROFILE_IMAGE_FILE,
        '프로필 이미지를 업로드해주세요.',
      );
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_PROFILE_IMAGE_FILE,
        '이미지 파일만 업로드할 수 있습니다.',
      );
    }

    const profileImageUrl = await this.s3UploadService.uploadImage(
      file,
      `profiles/${currentUser.id}`,
    );

    const user = await this.usersService.updateProfileImage(
      currentUser.id,
      profileImageUrl,
    );

    return {
      id: Number(user.id),
      email: user.email,
      nickname: user.nickname,
      emailVerifiedAt: user.emailVerifiedAt,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
    };
  }
}
