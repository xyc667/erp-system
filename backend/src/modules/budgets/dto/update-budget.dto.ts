import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateBudgetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
