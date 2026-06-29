import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;
}
