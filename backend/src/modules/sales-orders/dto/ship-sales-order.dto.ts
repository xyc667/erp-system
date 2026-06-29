import { IsNotEmpty, IsString } from 'class-validator';

export class ShipSalesOrderDto {
  @IsNotEmpty()
  @IsString()
  warehouseId: string;
}
