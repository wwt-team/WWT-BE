import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTradeRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
