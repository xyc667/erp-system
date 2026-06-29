import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTenantDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  schemaName?: string;
}
