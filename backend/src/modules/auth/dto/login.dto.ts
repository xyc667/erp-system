import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  tenantCode?: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}