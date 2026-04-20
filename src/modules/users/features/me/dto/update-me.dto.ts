import { IsOptional, IsUrl } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsUrl(
    { require_protocol: true },
    { message: 'INVALID_PROFILE_IMAGE_URL' },
  )
  profileImageUrl?: string | null;
}
