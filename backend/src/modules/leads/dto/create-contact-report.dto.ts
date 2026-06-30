import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { CONTACT_RESULTS } from '../leads.constants';

export class CreateContactReportDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['call', 'visit', 'wechat', 'other'])
  type: string;

  @IsNotEmpty()
  @IsString()
  @IsIn([...CONTACT_RESULTS])
  result: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @ValidateIf((o) => o.result === 'schedule_next')
  @IsNotEmpty()
  @IsString()
  nextActionAt?: string;

  @IsOptional()
  @IsString()
  @IsIn(['valid', 'empty_phone', 'closed', 'not_target', 'unknown'])
  quality?: string;

  @IsOptional()
  @IsUUID()
  recordingFileId?: string;
}
