import { IsNumber, Min } from 'class-validator';

export class RecordReceiptDto {
  @IsNumber()
  @Min(0.01)
  amount: number;
}
