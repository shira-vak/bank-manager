import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { AccountIdDto } from './dtos/account-id.dto';
import { CreateAccountDto } from './dtos/create-account.dto';
import { SetActiveDto } from './dtos/set-active.dto';
import { SetDailyWithdrawalLimitDto } from './dtos/set-daily-withdrawal-limit.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private accountService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  async createAccount(@Body() body: CreateAccountDto) {
    return this.accountService.createAccount(body);
  }

  @Get('person/:personId')
  @ApiOperation({ summary: 'Get all accounts for a person' })
  @ApiParam({ name: 'personId' })
  async getAllAccounts(@Param('personId') personId: string) {
    return this.accountService.getAllAccounts(personId);
  }

  @Get(':accountId')
  @ApiOperation({ summary: 'Get a single account by ID' })
  @ApiParam({ name: 'accountId' })
  async getAccount(@Param() params: AccountIdDto) {
    return this.accountService.getAccountById(params.accountId);
  }

  @Post(':accountId/active')
  @HttpCode(200)
  @ApiOperation({ summary: 'Set account active/inactive' })
  @ApiParam({ name: 'accountId' })
  async setActive(@Param() params: AccountIdDto, @Body() body: SetActiveDto) {
    return this.accountService.setActive(params.accountId, body.isActive);
  }

  @Post(':accountId/set-daily-withdrawal')
  @HttpCode(200)
  @ApiOperation({ summary: 'Set the daily withdrawal limit' })
  @ApiParam({ name: 'accountId' })
  async setDailyWithdrawalLimit(@Param() params: AccountIdDto, @Body() body: SetDailyWithdrawalLimitDto) {
    return this.accountService.setDailyWithdrawalLimit(params.accountId, body.limit);
  }
}
