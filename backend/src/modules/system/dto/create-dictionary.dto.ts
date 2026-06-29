import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDictionaryDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
