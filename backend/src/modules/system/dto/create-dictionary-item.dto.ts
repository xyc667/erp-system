import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDictionaryItemDto {
  @IsNotEmpty()
  @IsString()
  label: string;

  @IsNotEmpty()
  @IsString()
  value: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
