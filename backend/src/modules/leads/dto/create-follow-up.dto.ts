import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFollowUpDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['call', 'visit', 'wechat', 'other'])
  type: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  nextActionAt?: string;

  @IsOptional()
  @IsString()
  @IsIn(['valid', 'empty_phone', 'closed', 'not_target', 'unknown'])
  quality?: string;
}
