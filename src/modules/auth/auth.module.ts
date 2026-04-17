import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { AuthEmailService } from './auth-email.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerification } from './entities/email-verification.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { EmailVerificationService } from './features/email-verification/email-verification.service';
import { LoginService } from './features/login/login.service';
import { LogoutService } from './features/logout/logout.service';
import { RefreshTokenService } from './features/refresh/refresh-token.service';
import { SignupService } from './features/signup/signup.service';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([EmailVerification, RefreshToken]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthEmailService,
    AuthService,
    JwtStrategy,
    EmailVerificationService,
    LoginService,
    RefreshTokenService,
    LogoutService,
    SignupService,
  ],
})
export class AuthModule {}
