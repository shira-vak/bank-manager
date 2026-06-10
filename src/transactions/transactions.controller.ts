import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AccountIdDto } from 'src/accounts/dtos/account-id.dto';
import { TransactionAmountDto } from './dtos/transaction-amount.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private transactionService: TransactionsService) {}

  @Post(':accountId/deposit')
  @ApiOperation({ summary: 'Deposit money into an account' })
  @ApiParam({ name: 'accountId' })
  deposit(@Param() params: AccountIdDto, @Body() body: TransactionAmountDto) {
    return this.transactionService.deposit(params.accountId, body.amount);
  }

  @Post(':accountId/withdraw')
  @ApiOperation({ summary: 'Withdraw money from an account' })
  @ApiParam({ name: 'accountId' })
  withdraw(@Param() params: AccountIdDto, @Body() body: TransactionAmountDto) {
    return this.transactionService.withdraw(params.accountId, body.amount);
  }
}
