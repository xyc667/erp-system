import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConfigDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  group?: string;
}
