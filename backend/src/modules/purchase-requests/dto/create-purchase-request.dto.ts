import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseRequestItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  estimatedPrice?: number;
}

export class CreatePurchaseRequestDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseRequestItemDto)
  items: PurchaseRequestItemDto[];
}

export class ConvertPurchaseRequestDto {
  @IsNotEmpty()
  @IsString()
  vendorId: string;
}
