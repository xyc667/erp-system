import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SalesQuoteItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;
}

export class CreateSalesQuoteDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesQuoteItemDto)
  items: SalesQuoteItemDto[];
}
