import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { AccountsService } from '../../accounts/accounts.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DAILY_LIMIT,
  DEPOSIT_AMOUNT,
  INITIAL_BALANCE,
  MOCK_ACCOUNT,
  MOCK_ACCOUNT_ID,
  prismaMock,
  WITHDRAW_AMOUNT,
} from '../../test/consts';
import { TransactionsService } from '../transactions.service';

const accountsServiceMock = {
  getAccountById: jest.fn(),
};

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
      prismaMock._prismaClient.account.update.mockResolvedValue({ ...MOCK_ACCOUNT, balance: balanceAfter });
      prismaMock._prismaClient.transaction.create.mockResolvedValue({});

      const result = await service.deposit(MOCK_ACCOUNT_ID, DEPOSIT_AMOUNT);

      expect(result.balance.toString()).toBe(balanceAfter.toString());
      expect(prismaMock._prismaClient.transaction.create).toHaveBeenCalledWith({
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
    it('when balance and limit valid should withdraw from account', async () => {
      const balanceAfter = new Decimal(INITIAL_BALANCE - WITHDRAW_AMOUNT);
      accountsServiceMock.getAccountById.mockResolvedValue(MOCK_ACCOUNT);
      prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { value: null } });
      prismaMock._prismaClient.account.update.mockResolvedValue({ ...MOCK_ACCOUNT, balance: balanceAfter });
      prismaMock._prismaClient.transaction.create.mockResolvedValue({});

      const result = await service.withdraw(MOCK_ACCOUNT_ID, WITHDRAW_AMOUNT);

      expect(result.balance.toString()).toBe(balanceAfter.toString());
      expect(prismaMock._prismaClient.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'WITHDRAWAL', accountId: MOCK_ACCOUNT_ID }),
      });
    });

    it('when prior withdrawals today exceed daily limit should throw BadRequestException', async () => {
      accountsServiceMock.getAccountById.mockResolvedValue(MOCK_ACCOUNT);
      prismaMock.transaction.aggregate.mockResolvedValue({
        _sum: { value: new Decimal(DAILY_LIMIT - WITHDRAW_AMOUNT + 1) },
      });

      await expect(service.withdraw(MOCK_ACCOUNT_ID, WITHDRAW_AMOUNT)).rejects.toThrow(BadRequestException);
    });

    it('when current amount exceeds daily limit should throw BadRequestException', async () => {
      accountsServiceMock.getAccountById.mockResolvedValue({ ...MOCK_ACCOUNT, dailyWithdrawalLimit: new Decimal(0) });
      prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { value: null } });

      await expect(service.withdraw(MOCK_ACCOUNT_ID, WITHDRAW_AMOUNT)).rejects.toThrow(BadRequestException);
    });

    it.each([
      ['account is inactive', { activeFlag: false, balance: new Decimal(500), dailyWithdrawalLimit: new Decimal(300) }],
      [
        'balance is insufficient',
        { activeFlag: true, balance: new Decimal(50), dailyWithdrawalLimit: new Decimal(300) },
      ],
    ])('when %s should throw BadRequestException', async (_label, overrides) => {
      accountsServiceMock.getAccountById.mockResolvedValue({ ...MOCK_ACCOUNT, ...overrides });
      prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { value: null } });
      await expect(service.withdraw(MOCK_ACCOUNT_ID, WITHDRAW_AMOUNT)).rejects.toThrow(BadRequestException);
    });

    it('when account does not exist should throw NotFoundException', async () => {
      accountsServiceMock.getAccountById.mockRejectedValue(new NotFoundException());
      await expect(service.withdraw(MOCK_ACCOUNT_ID, WITHDRAW_AMOUNT)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTodayWithdrawnAmount', () => {
    it('when there are withdrawals today should return their sum ignoring deposits', async () => {
      accountsServiceMock.getAccountById.mockResolvedValue(MOCK_ACCOUNT);
      prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { value: new Decimal(150) } });

      const result = await service.getTodayWithdrawnAmount(MOCK_ACCOUNT_ID);

      expect(result).toBe(150);
    });

    it('when there are no transactions today should return 0', async () => {
      accountsServiceMock.getAccountById.mockResolvedValue(MOCK_ACCOUNT);
      prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { value: null } });

      const result = await service.getTodayWithdrawnAmount(MOCK_ACCOUNT_ID);

      expect(result).toBe(0);
    });

    it('when account does not exist should throw NotFoundException', async () => {
      accountsServiceMock.getAccountById.mockRejectedValue(new NotFoundException());
      await expect(service.getTodayWithdrawnAmount(MOCK_ACCOUNT_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTransactionsByPeriod', () => {
    const startDate = new Date('2024-04-04T00:00:00.000Z');
    const endDate = new Date('2026-12-12T00:00:00.000Z');

    it('when account exists should return both deposits and withdrawals in the period', async () => {
      const mockTransactions = [
        {
          transactionId: 't1',
          accountId: MOCK_ACCOUNT_ID,
          value: new Decimal(100),
          type: 'DEPOSIT',
          transactionDate: new Date('2024-01-10'),
        },
        {
          transactionId: 't2',
          accountId: MOCK_ACCOUNT_ID,
          value: new Decimal(50),
          type: 'WITHDRAWAL',
          transactionDate: new Date('2024-01-20'),
        },
      ];
      accountsServiceMock.getAccountById.mockResolvedValue(MOCK_ACCOUNT);
      prismaMock.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getTransactionsByPeriod(MOCK_ACCOUNT_ID, startDate, endDate);

      expect(result).toHaveLength(2);
      expect(result.some((t) => t.type === 'DEPOSIT')).toBe(true);
      expect(result.some((t) => t.type === 'WITHDRAWAL')).toBe(true);
      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith({
        where: { accountId: MOCK_ACCOUNT_ID, transactionDate: { gte: startDate, lte: endDate } },
        orderBy: { transactionDate: 'asc' },
      });
    });

    it('when account exists and has no transactions in period should return empty array', async () => {
      accountsServiceMock.getAccountById.mockResolvedValue(MOCK_ACCOUNT);
      prismaMock.transaction.findMany.mockResolvedValue([]);

      const result = await service.getTransactionsByPeriod(MOCK_ACCOUNT_ID, startDate, endDate);

      expect(result).toHaveLength(0);
    });

    it('when startDate is not before endDate should throw BadRequestException', async () => {
      accountsServiceMock.getAccountById.mockResolvedValue(MOCK_ACCOUNT);
      await expect(service.getTransactionsByPeriod(MOCK_ACCOUNT_ID, endDate, startDate)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('when account does not exist should throw NotFoundException', async () => {
      accountsServiceMock.getAccountById.mockRejectedValue(new NotFoundException());
      await expect(service.getTransactionsByPeriod(MOCK_ACCOUNT_ID, startDate, endDate)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
