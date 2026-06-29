import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWorkOrderDto {
  @IsOptional()
  @IsString()
  bomId?: string;

  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsNotEmpty()
  @IsNumber()
  plannedQty: number;

  @IsOptional()
  @IsString()
  warehouseId?: string;
}
