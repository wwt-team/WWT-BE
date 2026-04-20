import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { ApiException } from '../../common/exceptions/api.exception';
import { User } from './entities/user.entity';

type CreateUserInput = {
  email: string;
  passwordHash: string;
  nickname: string;
  emailVerifiedAt: Date;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByIdOrThrow(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: String(userId) },
    });

    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND,
        '사용자를 찾을 수 없습니다.',
      );
    }

    return user;
  }

  create(input: CreateUserInput) {
    const user = this.usersRepository.create(input);
    return this.usersRepository.save(user);
  }

  async updateProfileImage(userId: string, profileImageUrl: string | null) {
    const user = await this.findByIdOrThrow(userId);
    user.profileImageUrl = profileImageUrl;
    return this.usersRepository.save(user);
  }
}
