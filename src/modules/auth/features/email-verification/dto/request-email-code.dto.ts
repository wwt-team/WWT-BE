import { IsEmail } from 'class-validator';

export class RequestEmailCodeDto {
  @IsEmail({}, { message: 'INVALID_EMAIL_CODE_REQUEST_EMAIL' })
  email!: string;
}
