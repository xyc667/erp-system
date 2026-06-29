import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateQualityInspectionDto {
  @IsNotEmpty()
  @IsString()
  workOrderId: string;

  @IsNotEmpty()
  @IsNumber()
  inspectedQty: number;

  @IsNotEmpty()
  @IsNumber()
  passedQty: number;

  @IsNotEmpty()
  @IsNumber()
  failedQty: number;

  @IsOptional()
  @IsString()
  result?: string;
}
