import { Injectable } from '@nestjs/common';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { UsersService } from '../../users.service';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UpdateMeService {
  constructor(private readonly usersService: UsersService) {}

  async updateMe(currentUser: RequestUser, dto: UpdateMeDto) {
    const user = await this.usersService.updateProfileImage(
      currentUser.id,
      dto.profileImageUrl ?? null,
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
