import { IsOptional, IsString } from 'class-validator';

export class UpdateConfigDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  group?: string;
}
