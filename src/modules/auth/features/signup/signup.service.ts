import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ApiException } from '../../../../common/exceptions/api.exception';
import { hashPassword } from '../../../../common/utils/password.util';
import { hashToken } from '../../../../common/utils/token.util';
import { UsersService } from '../../../users/users.service';
import { EmailVerification } from '../../entities/email-verification.entity';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class SignupService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(EmailVerification)
    private readonly emailVerificationsRepository: Repository<EmailVerification>,
  ) {}

  async signup(dto: SignupDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ERROR_CODES.EMAIL_ALREADY_EXISTS,
        '이미 가입된 이메일입니다.',
      );
    }

    const emailVerification = await this.findEmailVerification(dto);
    const passwordHash = await hashPassword(dto.password);

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      nickname: dto.nickname,
      emailVerifiedAt: emailVerification.verifiedAt ?? new Date(),
    });

    emailVerification.tokenUsedAt = new Date();
    await this.emailVerificationsRepository.save(emailVerification);

    return {
      id: Number(user.id),
      email: user.email,
      nickname: user.nickname,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  }

  private async findEmailVerification(dto: SignupDto) {
    const tokenHash = hashToken(dto.emailVerificationToken);

    const emailVerification = await this.emailVerificationsRepository.findOne({
      where: { tokenHash },
      order: { createdAt: 'DESC' },
    });

    if (!emailVerification) {
      throw this.invalidToken();
    }

    if (emailVerification.email !== dto.email) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.EMAIL_VERIFICATION_EMAIL_MISMATCH,
        '인증한 이메일과 회원가입 이메일이 일치하지 않습니다.',
      );
    }

    if (!emailVerification.verifiedAt) {
      throw this.invalidToken();
    }

    if (emailVerification.tokenUsedAt) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.USED_EMAIL_VERIFICATION_TOKEN,
        '이미 사용된 이메일 인증입니다. 다시 인증해주세요.',
      );
    }

    if (
      !emailVerification.tokenExpiresAt ||
      emailVerification.tokenExpiresAt <= new Date()
    ) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.EXPIRED_EMAIL_VERIFICATION_TOKEN,
        '이메일 인증 시간이 만료되었습니다. 다시 인증해주세요.',
      );
    }

    return emailVerification;
  }

  private invalidToken() {
    return new ApiException(
      HttpStatus.BAD_REQUEST,
      ERROR_CODES.INVALID_EMAIL_VERIFICATION_TOKEN,
      '이메일 인증 정보가 올바르지 않습니다. 다시 인증해주세요.',
    );
  }
}
