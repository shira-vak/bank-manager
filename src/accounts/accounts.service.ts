import { Injectable, NotFoundException } from '@nestjs/common';
import { Account } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { accountTypeMap } from './consts';
import { CreateAccountDto } from './dtos/create-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prismaService: PrismaService) {}

  async createAccount(dto: CreateAccountDto): Promise<Account> {
    return await this.prismaService.account.create({
      data: {
        personId: dto.personId,
        dailyWithdrawalLimit: dto.dailyWithdrawalLimit,
        accountType: accountTypeMap[dto.accountType],
      },
    });
  }

  async getAllAccounts(personId: string): Promise<Account[]> {
    return this.prismaService.account.findMany({ where: { personId } });
  }

  async getAccountById(accountId: string): Promise<Account> {
    const account = await this.prismaService.account.findUnique({
      where: { accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account '${accountId}' not found.`);
    }

    return account;
  }

  async setActive(accountId: string, isActive: boolean): Promise<Account> {
    await this.getAccountById(accountId);

    return await this.prismaService.account.update({
      where: { accountId },
      data: { activeFlag: isActive },
    });
  }

  async setDailyWithdrawalLimit(accountId: string, limit: number): Promise<Account> {
    await this.getAccountById(accountId);

    return await this.prismaService.account.update({
      where: { accountId },
      data: { dailyWithdrawalLimit: limit },
    });
  }
}
