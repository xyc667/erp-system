import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateReplenishmentRequestDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];
}
