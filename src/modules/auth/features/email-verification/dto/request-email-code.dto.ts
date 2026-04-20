import { IsEmail, Matches } from 'class-validator';
import { SCHOOL_EMAIL_REGEX } from '../../../../../common/constants/school-email';

export class RequestEmailCodeDto {
  @IsEmail({}, { message: 'INVALID_EMAIL_CODE_REQUEST_EMAIL' })
  @Matches(SCHOOL_EMAIL_REGEX, { message: 'INVALID_EMAIL_CODE_REQUEST_EMAIL' })
  email!: string;
}
