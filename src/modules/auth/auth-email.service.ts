import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class AuthEmailService {
  constructor(private readonly configService: ConfigService) {}

  async sendEmailVerificationCode(email: string, code: string) {
    const transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port: Number(this.configService.getOrThrow<string>('SMTP_PORT')),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.getOrThrow<string>('SMTP_USER'),
        pass: this.configService.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });

    await transporter.sendMail({
      from: this.configService.getOrThrow<string>('SMTP_FROM'),
      to: email,
      subject: '[DSM trading] 이메일 인증 코드',
      text: `인증 코드는 ${code} 입니다.`,
    });
  }
}
