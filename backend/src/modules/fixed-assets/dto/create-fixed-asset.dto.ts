import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFixedAssetDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber()
  @Min(0)
  originalValue: number;

  @IsInt()
  @Min(1)
  usefulLifeMonths: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsString()
  location?: string;
}
