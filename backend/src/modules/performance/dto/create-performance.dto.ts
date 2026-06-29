import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePerformanceDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsNotEmpty()
  @IsString()
  period: string;

  @IsNotEmpty()
  @IsNumber()
  score: number;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
