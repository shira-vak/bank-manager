import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class TransactionAmountDto {
  @IsNumber()
  @IsPositive({ message: 'Amount must be greater than 0' })
  @ApiProperty({ description: 'The amount for the transaction' })
  amount: number;
}
