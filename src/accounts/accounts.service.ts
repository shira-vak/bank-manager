import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { accountTypeMap } from './consts';
import { CreateAccountDto } from './dtos/create-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prismaService: PrismaService) {}

  async createAccount(dto: CreateAccountDto) {
    return await this.prismaService.account.create({
      data: {
        personId: dto.personId,
        dailyWithdrawalLimit: dto.dailyWithdrawalLimit,
        accountType: accountTypeMap[dto.accountType],
      },
    });
  }

  async getAllAccounts(personId: string) {
    const accounts = await this.prismaService.account.findMany({
      where: { personId },
    });

    if (!accounts || accounts.length === 0) {
      throw new NotFoundException(`No accounts found for person id: ${personId}`);
    }

    return accounts;
  }

  async getAccountById(accountId: string) {
    const account = await this.prismaService.account.findUnique({
      where: { accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account '${accountId}' not found.`);
    }

    return account;
  }

  async setActive(accountId: string, isActive: boolean) {
    await this.getAccountById(accountId);

    return await this.prismaService.account.update({
      where: { accountId },
      data: { activeFlag: isActive },
    });
  }

  async setDailyWithdrawalLimit(accountId: string, limit: number) {
    await this.getAccountById(accountId);

    return await this.prismaService.account.update({
      where: { accountId },
      data: { dailyWithdrawalLimit: limit },
    });
  }
}
