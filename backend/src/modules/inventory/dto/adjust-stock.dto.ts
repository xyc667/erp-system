import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdjustStockDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsString()
  warehouseId: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  batchNo?: string;

  @IsOptional()
  @IsString()
  serialNo?: string;
}
