import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class TransferStockDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsString()
  fromWarehouseId: string;

  @IsNotEmpty()
  @IsString()
  toWarehouseId: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsOptional()
  @IsString()
  referenceNo?: string;
}
