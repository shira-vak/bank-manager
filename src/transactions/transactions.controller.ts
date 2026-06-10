import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AccountIdDto } from 'src/accounts/dtos/account-id.dto';
import { StatementQueryDto } from 'src/transactions/dtos/statement-query.dto';
import { TransactionAmountDto } from './dtos/transaction-amount.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private transactionService: TransactionsService) {}

  @Post(':accountId/deposit')
  @HttpCode(200)
  @ApiOperation({ summary: 'Deposit money into an account' })
  @ApiParam({ name: 'accountId' })
  deposit(@Param() params: AccountIdDto, @Body() body: TransactionAmountDto) {
    return this.transactionService.deposit(params.accountId, body.amount);
  }

  @Post(':accountId/withdraw')
  @HttpCode(200)
  @ApiOperation({ summary: 'Withdraw money from an account' })
  @ApiParam({ name: 'accountId' })
  withdraw(@Param() params: AccountIdDto, @Body() body: TransactionAmountDto) {
    return this.transactionService.withdraw(params.accountId, body.amount);
  }

  @Get(':accountId/statement')
  @ApiOperation({ summary: 'Get account statement filtered by period' })
  @ApiParam({ name: 'accountId' })
  @ApiQuery({ name: 'startDate', type: String, example: '2024-04-04T00:00:00.000Z' })
  @ApiQuery({ name: 'endDate', type: String, example: '2026-12-12T00:00:00.000Z' })
  getStatement(@Param() params: AccountIdDto, @Query() query: StatementQueryDto) {
    return this.transactionService.getTransactionsByPeriod(
      params.accountId,
      new Date(query.startDate),
      new Date(query.endDate),
    );
  }

  @Get(':accountId/today-withdrawn')
  @ApiOperation({ summary: 'Get total withdrawn amount for today' })
  @ApiParam({ name: 'accountId' })
  getTodayWithdrawnAmount(@Param() params: AccountIdDto) {
    return this.transactionService.getTodayWithdrawnAmount(params.accountId);
  }
}
