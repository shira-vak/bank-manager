import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AccountType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  CHECKING,
  MIN_DAILY_LIMIT,
  MOCK_ACCOUNT,
  MOCK_ACCOUNT_ID,
  MOCK_PERSON_ID,
  NEW_DAILY_LIMIT,
  SAVINGS,
} from '../../../test/consts';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountsService } from '../accounts.service';

const prismaMock = {
  account: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('AccountsService', () => {
  let service: AccountsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AccountsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(AccountsService);
    jest.clearAllMocks();
  });

  describe('createAccount', () => {
    it.each([
      [CHECKING, AccountType.CHECKING],
      [SAVINGS, AccountType.SAVINGS],
    ])('when accountType is %i should map to Prisma enum %s', async (input, expected) => {
      prismaMock.account.create.mockResolvedValue({ ...MOCK_ACCOUNT, accountType: expected });

      const result = await service.createAccount({
        personId: MOCK_PERSON_ID,
        dailyWithdrawalLimit: 300,
        accountType: input,
      });

      expect(prismaMock.account.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ accountType: expected }),
      });
      expect(result.accountType).toBe(expected);
    });
  });

  describe('getAllAccounts', () => {
    test.each([
      { accounts: [MOCK_ACCOUNT] },
      { accounts: [MOCK_ACCOUNT, MOCK_ACCOUNT] },
      { accounts: [MOCK_ACCOUNT, MOCK_ACCOUNT, MOCK_ACCOUNT] },
    ])('when person has $accounts.length account(s) → should return them', async ({ accounts }) => {
      prismaMock.account.findMany.mockResolvedValue(accounts);

      const result = await service.getAllAccounts(MOCK_PERSON_ID);

      expect(result).toHaveLength(accounts.length);
    });

    it('when person has no accounts should throw NotFoundException', async () => {
      prismaMock.account.findMany.mockResolvedValue([]);
      await expect(service.getAllAccounts(MOCK_PERSON_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAccountById', () => {
    it('when account exists should return it', async () => {
      prismaMock.account.findUnique.mockResolvedValue(MOCK_ACCOUNT);
      const result = await service.getAccountById(MOCK_ACCOUNT_ID);
      expect(result.accountId).toBe(MOCK_ACCOUNT_ID);
    });

    it('when account does not exist should throw NotFoundException', async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);
      await expect(service.getAccountById(MOCK_ACCOUNT_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('setActive', () => {
    test.each([
      { initial: true, updated: false },
      { initial: false, updated: true },
    ])('when account activity is initially $initial should update to $updated', async ({ initial, updated }) => {
      prismaMock.account.findUnique.mockResolvedValue({ ...MOCK_ACCOUNT, activeFlag: initial });
      prismaMock.account.update.mockResolvedValue({ ...MOCK_ACCOUNT, activeFlag: updated });

      const result = await service.setActive(MOCK_ACCOUNT_ID, updated);

      expect(result.activeFlag).toBe(updated);
    });

    it('when account does not exist should throw NotFoundException', async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);
      await expect(service.setActive(MOCK_ACCOUNT_ID, false)).rejects.toThrow(NotFoundException);
    });
  });

  describe('setDailyWithdrawalLimit', () => {
    test.each([{ limit: NEW_DAILY_LIMIT }, { limit: MIN_DAILY_LIMIT }])(
      'when account exists should update limit to $limit',
      async ({ limit }) => {
        prismaMock.account.findUnique.mockResolvedValue(MOCK_ACCOUNT);
        prismaMock.account.update.mockResolvedValue({ ...MOCK_ACCOUNT, dailyWithdrawalLimit: new Decimal(limit) });

        const result = await service.setDailyWithdrawalLimit(MOCK_ACCOUNT_ID, limit);
        expect(result.dailyWithdrawalLimit.toString()).toBe(String(limit));
      },
    );

    it('when account does not exist should throw NotFoundException', async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);
      await expect(service.setDailyWithdrawalLimit(MOCK_ACCOUNT_ID, NEW_DAILY_LIMIT)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
