import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class SetDailyWithdrawalLimitDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  limit: number;
}
