import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsNotEmpty()
  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  safetyStock?: number;

  @IsOptional()
  @IsBoolean()
  trackSerial?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
