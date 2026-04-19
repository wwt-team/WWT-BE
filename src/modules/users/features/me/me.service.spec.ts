import { MeService } from './me.service';

describe('MeService', () => {
  const usersService = {
    findByIdOrThrow: jest.fn(),
  };

  const service = new MeService(usersService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns only the documented profile fields', async () => {
    const createdAt = new Date('2026-04-19T00:00:00.000Z');
    const updatedAt = new Date('2026-04-19T01:00:00.000Z');
    const emailVerifiedAt = new Date('2026-04-18T00:00:00.000Z');

    usersService.findByIdOrThrow.mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      nickname: 'tester',
      emailVerifiedAt,
      createdAt,
      updatedAt,
    });

    await expect(
      service.getMe({ id: '1', email: 'user@example.com' }),
    ).resolves.toEqual({
      id: 1,
      email: 'user@example.com',
      nickname: 'tester',
      emailVerifiedAt,
      createdAt,
    });
  });
});
