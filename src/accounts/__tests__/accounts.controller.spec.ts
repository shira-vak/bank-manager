import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AccountType } from '@prisma/client';
import request from 'supertest';
import { DecimalTransformInterceptor } from '../../common/decimal-transform.interceptor';
import {
  CHECKING,
  DAILY_LIMIT,
  INVALID_ACCOUNT_TYPE,
  INVALID_DAILY_LIMIT,
  INVALID_UUID,
  MOCK_ACCOUNT_ID,
  MOCK_ACCOUNT_RESPONSE,
  MOCK_PERSON_ID,
  NEW_DAILY_LIMIT,
  SAVINGS,
} from '../../test/consts';
import { AccountsController } from '../accounts.controller';
import { AccountsService } from '../accounts.service';

const serviceMock = {
  createAccount: jest.fn(),
  getAllAccounts: jest.fn(),
  getAccountById: jest.fn(),
  setActive: jest.fn(),
  setDailyWithdrawalLimit: jest.fn(),
};

describe('AccountsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [{ provide: AccountsService, useValue: serviceMock }],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalInterceptors(new DecimalTransformInterceptor());
    await app.init();
  });

  beforeEach(() => jest.clearAllMocks());
  afterAll(() => app.close());

  describe('POST /accounts', () => {
    it.each([
      [CHECKING, AccountType.CHECKING],
      [SAVINGS, AccountType.SAVINGS],
    ])('when accountType is %i should return 201 with the created account', async (input, expected) => {
      serviceMock.createAccount.mockResolvedValue({ ...MOCK_ACCOUNT_RESPONSE, accountType: expected });

      const res = await request(app.getHttpServer())
        .post('/accounts')
        .send({ personId: MOCK_PERSON_ID, dailyWithdrawalLimit: DAILY_LIMIT, accountType: input })
        .expect(201);

      expect(res.body.accountType).toBe(expected);
    });

    it.each([
      ['personId is missing', { dailyWithdrawalLimit: DAILY_LIMIT, accountType: CHECKING }],
      [
        'accountType is invalid',
        { personId: MOCK_PERSON_ID, dailyWithdrawalLimit: DAILY_LIMIT, accountType: INVALID_ACCOUNT_TYPE },
      ],
      [
        'dailyWithdrawalLimit is negative',
        { personId: MOCK_PERSON_ID, dailyWithdrawalLimit: INVALID_DAILY_LIMIT, accountType: CHECKING },
      ],
      [
        'unknown extra field is sent',
        { personId: MOCK_PERSON_ID, dailyWithdrawalLimit: DAILY_LIMIT, accountType: CHECKING, extra: 'x' },
      ],
    ])('when %s should return 400', async (_label, body) => {
      await request(app.getHttpServer()).post('/accounts').send(body).expect(400);
    });
  });

  describe('GET /accounts/person/:personId', () => {
    it('when accounts exist should return 200 with the list', async () => {
      serviceMock.getAllAccounts.mockResolvedValue([MOCK_ACCOUNT_RESPONSE, MOCK_ACCOUNT_RESPONSE]);
      const res = await request(app.getHttpServer()).get(`/accounts/person/${MOCK_PERSON_ID}`).expect(200);
      expect(res.body).toHaveLength(2);
    });

    it('when person has no accounts should return 200 with empty array', async () => {
      serviceMock.getAllAccounts.mockResolvedValue([]);
      const res = await request(app.getHttpServer()).get(`/accounts/person/${MOCK_PERSON_ID}`).expect(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /accounts/:accountId', () => {
    it('when account exists should return 200 with the account', async () => {
      serviceMock.getAccountById.mockResolvedValue(MOCK_ACCOUNT_RESPONSE);
      const res = await request(app.getHttpServer()).get(`/accounts/${MOCK_ACCOUNT_ID}`).expect(200);
      expect(res.body.accountId).toBe(MOCK_ACCOUNT_ID);
    });

    it('when account does not exist should return 404', async () => {
      serviceMock.getAccountById.mockRejectedValue(new NotFoundException());
      await request(app.getHttpServer()).get(`/accounts/${MOCK_ACCOUNT_ID}`).expect(404);
    });

    it('when accountId is not a valid UUID should return 400', async () => {
      await request(app.getHttpServer()).get(`/accounts/${INVALID_UUID}`).expect(400);
    });
  });

  describe('POST /accounts/:accountId/active', () => {
    it('when valid should return 200 with updated account', async () => {
      serviceMock.setActive.mockResolvedValue({ ...MOCK_ACCOUNT_RESPONSE, activeFlag: false });
      const res = await request(app.getHttpServer())
        .post(`/accounts/${MOCK_ACCOUNT_ID}/active`)
        .send({ isActive: false })
        .expect(200);
      expect(res.body.activeFlag).toBe(false);
    });

    it('when account does not exist should return 404', async () => {
      serviceMock.setActive.mockRejectedValue(new NotFoundException());
      await request(app.getHttpServer())
        .post(`/accounts/${MOCK_ACCOUNT_ID}/active`)
        .send({ isActive: false })
        .expect(404);
    });

    it('when isActive is missing should return 400', async () => {
      await request(app.getHttpServer()).post(`/accounts/${MOCK_ACCOUNT_ID}/active`).send({}).expect(400);
    });
  });

  describe('POST /accounts/:accountId/set-daily-withdrawal', () => {
    it('when valid should return 200 with updated account', async () => {
      serviceMock.setDailyWithdrawalLimit.mockResolvedValue({
        ...MOCK_ACCOUNT_RESPONSE,
        dailyWithdrawalLimit: NEW_DAILY_LIMIT,
      });
      const res = await request(app.getHttpServer())
        .post(`/accounts/${MOCK_ACCOUNT_ID}/set-daily-withdrawal`)
        .send({ limit: NEW_DAILY_LIMIT })
        .expect(200);
      expect(res.body.dailyWithdrawalLimit).toBe(NEW_DAILY_LIMIT);
    });

    it('when account does not exist should return 404', async () => {
      serviceMock.setDailyWithdrawalLimit.mockRejectedValue(new NotFoundException());
      await request(app.getHttpServer())
        .post(`/accounts/${MOCK_ACCOUNT_ID}/set-daily-withdrawal`)
        .send({ limit: NEW_DAILY_LIMIT })
        .expect(404);
    });

    it('when limit is negative should return 400', async () => {
      await request(app.getHttpServer())
        .post(`/accounts/${MOCK_ACCOUNT_ID}/set-daily-withdrawal`)
        .send({ limit: INVALID_DAILY_LIMIT })
        .expect(400);
    });
  });
});
