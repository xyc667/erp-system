import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStocktakeDto {
  @IsNotEmpty()
  @IsString()
  warehouseId: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

import { IsNumber } from 'class-validator';

export class UpdateStocktakeItemDto {
  @IsNumber()
  countedQty: number;
}
