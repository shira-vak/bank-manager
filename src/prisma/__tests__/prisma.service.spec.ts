import { PrismaService } from '../prisma.service';

describe('PrismaService.onModuleInit', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
    jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('when DB is up should connect on the first attempt', async () => {
    jest.spyOn(service, '$connect').mockResolvedValue();

    await service.onModuleInit();

    expect(service.$connect).toHaveBeenCalledTimes(1);
  });

  it('when DB is down then recovers should retry and eventually connect', async () => {
    jest.spyOn(service, '$connect').mockRejectedValueOnce(new Error('connection refused')).mockResolvedValue();

    await service.onModuleInit();

    expect(service.$connect).toHaveBeenCalledTimes(2);
  });

  it('when DB stays down should throw after MAX_RETRIES attempts', async () => {
    jest.spyOn(service, '$connect').mockRejectedValue(new Error('connection refused'));

    await expect(service.onModuleInit()).rejects.toThrow('connection refused');
    expect(service.$connect).toHaveBeenCalledTimes(PrismaService.MAX_RETRIES);
  });

  it('should use exponential backoff between retries', async () => {
    const sleepSpy = jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);
    jest.spyOn(service, '$connect').mockRejectedValue(new Error('connection refused'));

    await expect(service.onModuleInit()).rejects.toThrow();

    expect(sleepSpy.mock.calls.map(([ms]) => ms)).toEqual([1000, 2000, 4000, 8000]);
  });
});
