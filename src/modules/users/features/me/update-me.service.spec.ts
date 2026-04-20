import { UpdateMeService } from './update-me.service';

describe('UpdateMeService', () => {
  const usersService = {
    updateProfileImage: jest.fn(),
  };

  const service = new UpdateMeService(usersService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates profile image and returns documented profile fields', async () => {
    const createdAt = new Date('2026-04-19T00:00:00.000Z');
    const emailVerifiedAt = new Date('2026-04-18T00:00:00.000Z');

    usersService.updateProfileImage.mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      nickname: 'tester',
      emailVerifiedAt,
      profileImageUrl: 'https://example.com/profile.png',
      createdAt,
    });

    await expect(
      service.updateMe(
        { id: '1', email: 'user@example.com' },
        { profileImageUrl: 'https://example.com/profile.png' },
      ),
    ).resolves.toEqual({
      id: 1,
      email: 'user@example.com',
      nickname: 'tester',
      emailVerifiedAt,
      profileImageUrl: 'https://example.com/profile.png',
      createdAt,
    });
  });
});
