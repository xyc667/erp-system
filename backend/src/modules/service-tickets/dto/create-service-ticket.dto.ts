import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateServiceTicketDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  salesOrderId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ResolveServiceTicketDto {
  @IsOptional()
  @IsString()
  resolution?: string;
}

export class UpdateServiceTicketStatusDto {
  @IsNotEmpty()
  @IsString()
  status: string;
}
