import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import {
  DAILY_LIMIT,
  DEPOSIT_AMOUNT,
  INITIAL_BALANCE,
  MOCK_ACCOUNT,
  MOCK_ACCOUNT_ID,
  WITHDRAW_AMOUNT,
} from '../../../test/consts';
import { AccountsService } from '../../accounts/accounts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionsService } from '../transactions.service';

const prismaMock = {
  account: { update: jest.fn() },
  transaction: { create: jest.fn() },
};
const accountsServiceMock = { getAccountById: jest.fn() };

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AccountsService, useValue: accountsServiceMock },
      ],
    }).compile();

    service = module.get(TransactionsService);
    jest.clearAllMocks();
  });

  describe('deposit', () => {
    it('when account is active should deposit and record transaction', async () => {
      const balanceAfter = new Decimal(INITIAL_BALANCE + DEPOSIT_AMOUNT);
      accountsServiceMock.getAccountById.mockResolvedValue(MOCK_ACCOUNT);
      prismaMock.account.update.mockResolvedValue({ ...MOCK_ACCOUNT, balance: balanceAfter });
      prismaMock.transaction.create.mockResolvedValue({});

      const result = await service.deposit(MOCK_ACCOUNT_ID, DEPOSIT_AMOUNT);

      expect(result.balance.toString()).toBe(balanceAfter.toString());
      expect(prismaMock.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'DEPOSIT', accountId: MOCK_ACCOUNT_ID }),
      });
    });

    it('when account is inactive should throw BadRequestException', async () => {
      accountsServiceMock.getAccountById.mockResolvedValue({ ...MOCK_ACCOUNT, activeFlag: false });
      await expect(service.deposit(MOCK_ACCOUNT_ID, DEPOSIT_AMOUNT)).rejects.toThrow(BadRequestException);
    });

    it('when account does not exist should throw NotFoundException', async () => {
      accountsServiceMock.getAccountById.mockRejectedValue(new NotFoundException());
      await expect(service.deposit(MOCK_ACCOUNT_ID, DEPOSIT_AMOUNT)).rejects.toThrow(NotFoundException);
    });
  });

  describe('withdraw', () => {
    it('when balance and daily limit allow it should withdraw and record transaction', async () => {
      const balanceAfter = new Decimal(INITIAL_BALANCE - WITHDRAW_AMOUNT);
      accountsServiceMock.getAccountById.mockResolvedValue(MOCK_ACCOUNT);
      prismaMock.account.update.mockResolvedValue({ ...MOCK_ACCOUNT, balance: balanceAfter });
      prismaMock.transaction.create.mockResolvedValue({});

      const result = await service.withdraw(MOCK_ACCOUNT_ID, WITHDRAW_AMOUNT);

      expect(result.balance.toString()).toBe(balanceAfter.toString());
      expect(prismaMock.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'WITHDRAWAL', accountId: MOCK_ACCOUNT_ID }),
      });
    });

    it.each([
      ['account is inactive', { activeFlag: false, balance: new Decimal(500), dailyWithdrawalLimit: new Decimal(300) }],
      [
        'balance is insufficient',
        { activeFlag: true, balance: new Decimal(50), dailyWithdrawalLimit: new Decimal(300) },
      ],
      [
        'amount exceeds daily limit',
        { activeFlag: true, balance: new Decimal(DAILY_LIMIT + 200), dailyWithdrawalLimit: new Decimal(100) },
      ],
    ])('when %s should throw BadRequestException', async (_label, overrides) => {
      accountsServiceMock.getAccountById.mockResolvedValue({ ...MOCK_ACCOUNT, ...overrides });
      await expect(service.withdraw(MOCK_ACCOUNT_ID, WITHDRAW_AMOUNT)).rejects.toThrow(BadRequestException);
    });

    it('when account does not exist should throw NotFoundException', async () => {
      accountsServiceMock.getAccountById.mockRejectedValue(new NotFoundException());
      await expect(service.withdraw(MOCK_ACCOUNT_ID, WITHDRAW_AMOUNT)).rejects.toThrow(NotFoundException);
    });
  });
});
