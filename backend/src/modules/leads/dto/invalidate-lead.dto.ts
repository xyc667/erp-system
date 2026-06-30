import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class InvalidateLeadDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['empty_phone', 'closed', 'not_target'])
  reason: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
