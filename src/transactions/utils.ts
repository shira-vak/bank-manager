import { Transaction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export const GetTotalWithdrawnAmount = (transactions: Transaction[]): number =>
  transactions
    .filter((t) => t.type === 'WITHDRAWAL')
    .reduce((sum, t) => sum.plus(t.value), new Decimal(0))
    .toNumber();
