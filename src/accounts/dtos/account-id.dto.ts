import { IsUUID } from 'class-validator';

export class AccountIdDto {
  @IsUUID()
  accountId: string;
}
