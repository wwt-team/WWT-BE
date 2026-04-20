import { ApiException } from '../../../../common/exceptions/api.exception';
import type { UploadedFile } from '../../../../common/types/uploaded-file.type';
import { UploadProfileImageService } from './upload-profile-image.service';

describe('UploadProfileImageService', () => {
  const usersService = {
    updateProfileImage: jest.fn(),
  };
  const s3UploadService = {
    uploadImage: jest.fn(),
  };

  const service = new UploadProfileImageService(
    usersService as never,
    s3UploadService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads profile image and stores returned url', async () => {
    const createdAt = new Date('2026-04-20T00:00:00.000Z');
    const emailVerifiedAt = new Date('2026-04-19T00:00:00.000Z');
    const file = {
      originalname: 'profile.png',
      mimetype: 'image/png',
      buffer: Buffer.from('profile'),
    } as UploadedFile;

    s3UploadService.uploadImage.mockResolvedValue(
      'https://bucket.s3.ap-northeast-2.amazonaws.com/profiles/1/profile.png',
    );
    usersService.updateProfileImage.mockResolvedValue({
      id: '1',
      email: 'user@dsm.hs.kr',
      nickname: 'tester',
      emailVerifiedAt,
      profileImageUrl:
        'https://bucket.s3.ap-northeast-2.amazonaws.com/profiles/1/profile.png',
      createdAt,
    });

    await expect(
      service.upload({ id: '1', email: 'user@dsm.hs.kr' }, file),
    ).resolves.toEqual({
      id: 1,
      email: 'user@dsm.hs.kr',
      nickname: 'tester',
      emailVerifiedAt,
      profileImageUrl:
        'https://bucket.s3.ap-northeast-2.amazonaws.com/profiles/1/profile.png',
      createdAt,
    });
  });

  it('rejects non-image files', async () => {
    const file = {
      originalname: 'profile.txt',
      mimetype: 'text/plain',
      buffer: Buffer.from('profile'),
    } as UploadedFile;

    await expect(
      service.upload({ id: '1', email: 'user@dsm.hs.kr' }, file),
    ).rejects.toBeInstanceOf(ApiException);
  });
});
