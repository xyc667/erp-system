import { IsOptional, IsString } from 'class-validator';

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
