import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProductionPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  plannedQty?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
