import { IsNotEmpty, IsString } from 'class-validator';

export class ReceivePurchaseOrderDto {
  @IsNotEmpty()
  @IsString()
  warehouseId: string;
}
