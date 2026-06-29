import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateInventoryDto {
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
  unit: string;

  @IsOptional()
  @IsString()
  batchNo?: string;
}
