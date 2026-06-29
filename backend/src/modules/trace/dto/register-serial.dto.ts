import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterSerialDto {
  @IsNotEmpty()
  @IsString()
  serialNo: string;

  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  batchNo?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;
}
