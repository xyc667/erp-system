import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

export class PurchaseOrderItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  unitPrice: number;
}

export class CreatePurchaseOrderDto {
  @IsNotEmpty()
  @IsString()
  vendorId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}
