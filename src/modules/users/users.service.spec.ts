import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const usersRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const service = new UsersService(usersRepository as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByIdOrThrow', () => {
    it('returns the user when it exists', async () => {
      const user = {
        id: '1',
        email: 'user@example.com',
        nickname: 'tester',
      };

      usersRepository.findOne.mockResolvedValue(user);

      await expect(service.findByIdOrThrow('1')).resolves.toBe(user);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('throws documented error when the user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.findByIdOrThrow('999')).rejects.toMatchObject({
        response: {
          statusCode: HttpStatus.NOT_FOUND,
          code: ERROR_CODES.USER_NOT_FOUND,
          message: '사용자를 찾을 수 없습니다.',
        },
      });
    });
  });

  describe('updateProfileImage', () => {
    it('updates profile image for existing user', async () => {
      const user = {
        id: '1',
        email: 'user@example.com',
        nickname: 'tester',
        profileImageUrl: null,
      };

      usersRepository.findOne.mockResolvedValue(user);
      usersRepository.save.mockResolvedValue({
        ...user,
        profileImageUrl: 'https://example.com/profile.png',
      });

      await expect(
        service.updateProfileImage('1', 'https://example.com/profile.png'),
      ).resolves.toMatchObject({
        id: '1',
        profileImageUrl: 'https://example.com/profile.png',
      });
    });
  });
});
