import { AccountType } from '@prisma/client';

export const accountTypeOptions = [1, 2]  as const;
export type AccountTypeOptions = typeof accountTypeOptions[number];

export const accountTypeMap: { [key in AccountTypeOptions]: AccountType } = {
  1: AccountType.CHECKING,
  2: AccountType.SAVINGS,
} as const;
