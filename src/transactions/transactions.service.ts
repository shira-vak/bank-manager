import { BadRequestException, Injectable } from '@nestjs/common';
import { AccountsService } from '../accounts/accounts.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prismaService: PrismaService,
    private accountsService: AccountsService,
  ) {}

  async deposit(accountId: string, amount: number) {
    const account = await this.accountsService.getAccountById(accountId);

    if (!account.activeFlag) {
      throw new BadRequestException('Account is not active');
    }

    const updated = await this.prismaService.account.update({
      where: { accountId },
      data: { balance: { increment: amount } },
    });

    await this.prismaService.transaction.create({
      data: { accountId, value: amount, type: 'DEPOSIT' },
    });

    return updated;
  }

  async withdraw(accountId: string, amount: number) {
    const account = await this.accountsService.getAccountById(accountId);

    if (!account.activeFlag) {
      throw new BadRequestException('Account is not active');
    }

    if (account.balance.lessThan(amount)) {
      throw new BadRequestException(`Not enough balance to withdraw ${amount} from account with current balance ${account.balance}`);
    }

    if (account.dailyWithdrawalLimit.lessThan(amount)) {
      throw new BadRequestException(`Amount exceeds daily withdrawal limit of ${account.dailyWithdrawalLimit}`);
    }

    const updated = await this.prismaService.account.update({
      where: { accountId },
      data: { balance: { decrement: amount } },
    });

    await this.prismaService.transaction.create({
      data: { accountId, value: amount, type: 'WITHDRAWAL' },
    });

    return updated;
  }
}
