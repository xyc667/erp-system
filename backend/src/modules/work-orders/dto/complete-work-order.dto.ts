import { IsNotEmpty, IsString } from 'class-validator';

export class CompleteWorkOrderDto {
  @IsNotEmpty()
  @IsString()
  warehouseId: string;
}
