import { SetMetadata } from '@nestjs/common';

export const AUTH_ERROR_MESSAGE_KEY = 'authErrorMessage';

export const AuthErrorMessage = (message: string) =>
  SetMetadata(AUTH_ERROR_MESSAGE_KEY, message);
