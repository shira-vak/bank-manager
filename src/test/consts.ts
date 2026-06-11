import { AccountType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export const CHECKING = 1 as const;
export const SAVINGS = 2 as const;
export const INVALID_ACCOUNT_TYPE = 0 as const;

export const MOCK_ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440000';
export const MOCK_PERSON_ID = 'test';
export const INVALID_UUID = 'bla';

export const INITIAL_BALANCE = 500;

export const DAILY_LIMIT = 300;
export const NEW_DAILY_LIMIT = 1000;
export const MIN_DAILY_LIMIT = 0;
export const INVALID_DAILY_LIMIT = -1;

export const DEPOSIT_AMOUNT = 100;
export const WITHDRAW_AMOUNT = 200;

export const MOCK_ACCOUNT = {
  accountId: MOCK_ACCOUNT_ID,
  personId: MOCK_PERSON_ID,
  balance: new Decimal(INITIAL_BALANCE),
  dailyWithdrawalLimit: new Decimal(DAILY_LIMIT),
  activeFlag: true,
  accountType: AccountType.CHECKING,
  createDate: new Date('2024-01-01'),
};

export const MOCK_ACCOUNT_RESPONSE = {
  accountId: MOCK_ACCOUNT_ID,
  personId: MOCK_PERSON_ID,
  balance: INITIAL_BALANCE,
  dailyWithdrawalLimit: DAILY_LIMIT,
  activeFlag: true,
  accountType: AccountType.CHECKING,
  createDate: new Date('2024-01-01').toISOString(),
};

const prismaClient = {
  account: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  transaction: { create: jest.fn(), findMany: jest.fn(), aggregate: jest.fn() },
};

export const prismaMock = {
  ...prismaClient,
  $transaction: jest.fn((cb: (prisma: typeof prismaClient) => Promise<unknown>) => cb(prismaClient)),
  _prismaClient: prismaClient,
};
