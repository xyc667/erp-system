import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsString()
  employeeNo: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  positionId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  hireDate?: string;
}
