import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class GlJournalLineDto {
  @IsNotEmpty()
  @IsString()
  accountId: string;

  @IsNotEmpty()
  @IsNumber()
  debit: number;

  @IsNotEmpty()
  @IsNumber()
  credit: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateGlJournalDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GlJournalLineDto)
  lines: GlJournalLineDto[];
}
