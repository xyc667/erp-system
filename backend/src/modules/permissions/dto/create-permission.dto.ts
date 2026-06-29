import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  module: string;

  @IsOptional()
  @IsString()
  description?: string;
}