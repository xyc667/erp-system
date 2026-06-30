import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewContactReportDto {
  @IsString()
  @IsIn(['approved', 'rejected'])
  status: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
