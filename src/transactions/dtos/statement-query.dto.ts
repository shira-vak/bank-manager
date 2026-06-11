import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/;
const ISO_DATE_MESSAGE = '$property must be a valid ISO date string.';

export class StatementQueryDto {
  @ApiProperty({ description: 'Start date in ISO 8601 format', example: '2024-04-04T00:00:00.000Z' })
  @Matches(ISO_DATE_REGEX, { message: ISO_DATE_MESSAGE })
  startDate: string;

  @ApiProperty({ description: 'End date in ISO 8601 format', example: '2026-12-12T00:00:00.000Z' })
  @Matches(ISO_DATE_REGEX, { message: ISO_DATE_MESSAGE })
  endDate: string;
}
