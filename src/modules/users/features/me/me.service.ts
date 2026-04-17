import { Injectable } from '@nestjs/common';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { UsersService } from '../../users.service';

@Injectable()
export class MeService {
  constructor(private readonly usersService: UsersService) {}

  async getMe(currentUser: RequestUser) {
    const user = await this.usersService.findByIdOrThrow(currentUser.id);

    return {
      id: Number(user.id),
      email: user.email,
      nickname: user.nickname,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
    };
  }
}
