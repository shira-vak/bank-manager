import { BadRequestException, Injectable } from '@nestjs/common';
import { Account, Transaction } from '@prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { GetTotalWithdrawnAmount } from './utils';

@Injectable()
export class TransactionsService {
  constructor(
    private prismaService: PrismaService,
    private accountsService: AccountsService,
  ) {}

  async deposit(accountId: string, amount: number): Promise<Account> {
    const account = await this.accountsService.getAccountById(accountId);

    if (!account.activeFlag) {
      throw new BadRequestException('Account is not active');
    }

    return this.prismaService.$transaction(async (tx) => {
      const updated = await tx.account.update({
        where: { accountId },
        data: { balance: { increment: amount } },
      });

      await tx.transaction.create({
        data: { accountId, value: amount, type: 'DEPOSIT' },
      });

      return updated;
    });
  }

  async getTodayWithdrawnAmount(accountId: string): Promise<number> {
    await this.accountsService.getAccountById(accountId);
   
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTransactions = await this.prismaService.transaction.findMany({
      where: { accountId, transactionDate: { gte: startOfToday } },
    });
    return GetTotalWithdrawnAmount(todayTransactions);
  }

  async withdraw(accountId: string, amount: number): Promise<Account> {
    const account = await this.accountsService.getAccountById(accountId);

    if (!account.activeFlag) {
      throw new BadRequestException('Account is not active');
    }

    if (account.balance.lessThan(amount)) {
      throw new BadRequestException(
        `Not enough balance to withdraw ${amount} from account with current balance ${account.balance}`,
      );
    }

    const withdrawnToday = await this.getTodayWithdrawnAmount(accountId);
    if (account.dailyWithdrawalLimit.toNumber() < withdrawnToday + amount) {
      throw new BadRequestException(
        `Amount exceeds daily withdrawal limit of ${account.dailyWithdrawalLimit}. You have withdrawn ${withdrawnToday} so far today.`,
      );
    }

    return this.prismaService.$transaction(async (tx) => {
      const updated = await tx.account.update({
        where: { accountId },
        data: { balance: { decrement: amount } },
      });

      await tx.transaction.create({
        data: { accountId, value: amount, type: 'WITHDRAWAL' },
      });

      return updated;
    });
  }

  async getTransactionsByPeriod(accountId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    await this.accountsService.getAccountById(accountId);

    return await this.prismaService.transaction.findMany({
      where: {
        accountId,
        transactionDate: { gte: startDate, lte: endDate },
      },
      orderBy: { transactionDate: 'asc' },
    });
  }
}
