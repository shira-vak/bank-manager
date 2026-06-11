import { BadRequestException, INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DecimalTransformInterceptor } from '../../common/decimal-transform.interceptor';
import {
  DEPOSIT_AMOUNT,
  INITIAL_BALANCE,
  MOCK_ACCOUNT_ID,
  MOCK_ACCOUNT_RESPONSE,
  WITHDRAW_AMOUNT,
} from '../../test/consts';
import { TransactionsController } from '../transactions.controller';
import { TransactionsService } from '../transactions.service';

const serviceMock = {
  deposit: jest.fn(),
  withdraw: jest.fn(),
  getTodayWithdrawnAmount: jest.fn(),
  getTransactionsByPeriod: jest.fn(),
};

describe('TransactionsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useValue: serviceMock }],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalInterceptors(new DecimalTransformInterceptor());
    await app.init();
  });

  beforeEach(() => jest.clearAllMocks());
  afterAll(() => app.close());

  describe('POST /transactions/:accountId/deposit', () => {
    it('when valid should return 200 with updated balance', async () => {
      serviceMock.deposit.mockResolvedValue({ ...MOCK_ACCOUNT_RESPONSE, balance: INITIAL_BALANCE + DEPOSIT_AMOUNT });
      const res = await request(app.getHttpServer())
        .post(`/transactions/${MOCK_ACCOUNT_ID}/deposit`)
        .send({ amount: DEPOSIT_AMOUNT })
        .expect(200);
      expect(res.body.balance).toBe(INITIAL_BALANCE + DEPOSIT_AMOUNT);
    });

    it('when account does not exist should return 404', async () => {
      serviceMock.deposit.mockRejectedValue(new NotFoundException());
      await request(app.getHttpServer())
        .post(`/transactions/${MOCK_ACCOUNT_ID}/deposit`)
        .send({ amount: DEPOSIT_AMOUNT })
        .expect(404);
    });

    it('when account is inactive should return 400', async () => {
      serviceMock.deposit.mockRejectedValue(new BadRequestException());
      await request(app.getHttpServer())
        .post(`/transactions/${MOCK_ACCOUNT_ID}/deposit`)
        .send({ amount: DEPOSIT_AMOUNT })
        .expect(400);
    });

    it.each([
      ['amount is 0', { amount: 0 }],
      ['amount is missing', {}],
    ])('when %s should return 400', async (_label, body) => {
      await request(app.getHttpServer()).post(`/transactions/${MOCK_ACCOUNT_ID}/deposit`).send(body).expect(400);
    });
  });

  describe('POST /transactions/:accountId/withdraw', () => {
    it('when valid should return 200 with updated balance', async () => {
      serviceMock.withdraw.mockResolvedValue({ ...MOCK_ACCOUNT_RESPONSE, balance: INITIAL_BALANCE - WITHDRAW_AMOUNT });
      const res = await request(app.getHttpServer())
        .post(`/transactions/${MOCK_ACCOUNT_ID}/withdraw`)
        .send({ amount: WITHDRAW_AMOUNT })
        .expect(200);
      expect(res.body.balance).toBe(INITIAL_BALANCE - WITHDRAW_AMOUNT);
    });

    it('when account does not exist should return 404', async () => {
      serviceMock.withdraw.mockRejectedValue(new NotFoundException());
      await request(app.getHttpServer())
        .post(`/transactions/${MOCK_ACCOUNT_ID}/withdraw`)
        .send({ amount: WITHDRAW_AMOUNT })
        .expect(404);
    });

    it('when service throws BadRequestException should return 400', async () => {
      serviceMock.withdraw.mockRejectedValue(new BadRequestException());
      await request(app.getHttpServer())
        .post(`/transactions/${MOCK_ACCOUNT_ID}/withdraw`)
        .send({ amount: WITHDRAW_AMOUNT })
        .expect(400);
    });

    it('when amount is 0 should return 400', async () => {
      await request(app.getHttpServer())
        .post(`/transactions/${MOCK_ACCOUNT_ID}/withdraw`)
        .send({ amount: 0 })
        .expect(400);
    });
  });

  describe('GET /transactions/:accountId/statement', () => {
    const START = '2024-01-01T00:00:00.000Z';
    const END = '2024-12-31T23:59:59.999Z';

    it('when valid should return 200 with transactions', async () => {
      const mockTx = [
        { transactionId: 't1', accountId: MOCK_ACCOUNT_ID, value: 100, type: 'DEPOSIT' },
        { transactionId: 't2', accountId: MOCK_ACCOUNT_ID, value: 50, type: 'WITHDRAWAL' },
      ];
      serviceMock.getTransactionsByPeriod.mockResolvedValue(mockTx);

      const res = await request(app.getHttpServer())
        .get(`/transactions/${MOCK_ACCOUNT_ID}/statement`)
        .query({ startDate: START, endDate: END })
        .expect(200);

      expect(res.body).toHaveLength(2);
    });

    it('when account does not exist should return 404', async () => {
      serviceMock.getTransactionsByPeriod.mockRejectedValue(new NotFoundException());
      await request(app.getHttpServer())
        .get(`/transactions/${MOCK_ACCOUNT_ID}/statement`)
        .query({ startDate: START, endDate: END })
        .expect(404);
    });

    it.each([
      ['startDate is an ordinal date without separators', { startDate: '2022028', endDate: END }],
      ['startDate is a plain number', { startDate: '5', endDate: END }],
      ['startDate is missing', { endDate: END }],
      ['endDate is missing', { startDate: START }],
    ])('when %s should return 400', async (_label, query) => {
      await request(app.getHttpServer()).get(`/transactions/${MOCK_ACCOUNT_ID}/statement`).query(query).expect(400);
    });
  });

  describe('GET /transactions/:accountId/today-withdrawn', () => {
    it('when valid should return 200 with total withdrawn as number', async () => {
      serviceMock.getTodayWithdrawnAmount.mockResolvedValue(100);
      const res = await request(app.getHttpServer())
        .get(`/transactions/${MOCK_ACCOUNT_ID}/today-withdrawn`)
        .expect(200);
      expect(Number(res.text)).toBe(100);
    });

    it('when account does not exist should return 404', async () => {
      serviceMock.getTodayWithdrawnAmount.mockRejectedValue(new NotFoundException());
      await request(app.getHttpServer()).get(`/transactions/${MOCK_ACCOUNT_ID}/today-withdrawn`).expect(404);
    });
  });
});
