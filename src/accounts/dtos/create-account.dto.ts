import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsString, Min } from 'class-validator';
import type { AccountTypeOptions } from '../consts';
import { accountTypeOptions } from '../consts';

export class CreateAccountDto {
  @IsString()
  @ApiProperty({ description: 'The ID of the person owning the account' })
  personId: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'The daily withdrawal limit for the account' })
  dailyWithdrawalLimit: number;

  @IsIn(accountTypeOptions)
  @ApiProperty({
    enum: accountTypeOptions,
    description: '1 = CHECKING, 2 = SAVINGS',
  })
  accountType: AccountTypeOptions;
}
