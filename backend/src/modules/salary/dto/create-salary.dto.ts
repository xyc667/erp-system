import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSalaryDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsNotEmpty()
  @IsString()
  yearMonth: string;

  @IsNotEmpty()
  @IsNumber()
  baseSalary: number;

  @IsOptional()
  @IsNumber()
  bonus?: number;

  @IsOptional()
  @IsNumber()
  deduction?: number;
}
