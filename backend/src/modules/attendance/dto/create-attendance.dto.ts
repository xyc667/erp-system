import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAttendanceDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
