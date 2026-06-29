import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBudgetDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsInt()
  @Min(2000)
  year: number;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;
}
