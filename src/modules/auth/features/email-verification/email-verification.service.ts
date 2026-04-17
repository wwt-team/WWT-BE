import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomInt } from 'crypto';
import { Repository } from 'typeorm';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ApiException } from '../../../../common/exceptions/api.exception';
import { hashToken } from '../../../../common/utils/token.util';
import { UsersService } from '../../../users/users.service';
import { AuthEmailService } from '../../auth-email.service';
import { EmailVerification } from '../../entities/email-verification.entity';
import { RequestEmailCodeDto } from './dto/request-email-code.dto';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly authEmailService: AuthEmailService,
    @InjectRepository(EmailVerification)
    private readonly emailVerificationsRepository: Repository<EmailVerification>,
  ) {}

  async requestEmailCode(dto: RequestEmailCodeDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ERROR_CODES.EMAIL_ALREADY_EXISTS,
        '이미 가입된 이메일입니다.',
      );
    }

    const code = this.generateCode();
    const codeHash = hashToken(code);
    const expiresAt = new Date(
      Date.now() +
        this.configService.get<number>('EMAIL_CODE_EXPIRES_IN_MINUTES', 10) *
          60 *
          1000,
    );

    const emailVerification = this.emailVerificationsRepository.create({
      email: dto.email,
      codeHash,
      expiresAt,
      verifiedAt: null,
      tokenHash: null,
      tokenExpiresAt: null,
      tokenUsedAt: null,
    });

    await this.emailVerificationsRepository.save(emailVerification);
    await this.authEmailService.sendEmailVerificationCode(dto.email, code);

    return {
      message: '인증 코드가 발송되었습니다.',
    };
  }

  async verifyEmailCode(dto: VerifyEmailCodeDto) {
    const codeHash = hashToken(dto.code);
    const emailVerification = await this.emailVerificationsRepository.findOne({
      where: { email: dto.email, codeHash },
      order: { createdAt: 'DESC' },
    });

    if (!emailVerification) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_EMAIL_CODE,
        '이메일 인증 코드가 올바르지 않습니다.',
      );
    }

    if (emailVerification.expiresAt <= new Date()) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.EXPIRED_EMAIL_CODE,
        '이메일 인증 코드가 만료되었습니다.',
      );
    }

    const emailVerificationToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(emailVerificationToken);
    emailVerification.verifiedAt = new Date();
    emailVerification.tokenHash = tokenHash;
    emailVerification.tokenExpiresAt = new Date(
      Date.now() +
        this.configService.get<number>(
          'EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_MINUTES',
          30,
        ) *
          60 *
          1000,
    );
    emailVerification.tokenUsedAt = null;

    await this.emailVerificationsRepository.save(emailVerification);

    return {
      emailVerificationToken,
    };
  }

  private generateCode() {
    return String(randomInt(100000, 1000000));
  }
}
