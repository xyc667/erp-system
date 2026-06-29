import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

export class SalesOrderItemDto {
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

export class CreateSalesOrderDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemDto)
  items: SalesOrderItemDto[];
}
