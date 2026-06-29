import { IsOptional, IsString } from 'class-validator';

export class UpdateBomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
