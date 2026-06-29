import { IsOptional, IsString } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
