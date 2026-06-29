import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateInventoryDto {
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  batchNo?: string;
}
