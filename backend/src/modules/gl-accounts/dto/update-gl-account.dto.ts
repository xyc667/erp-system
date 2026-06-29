import { IsOptional, IsString } from 'class-validator';

export class UpdateGlAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
