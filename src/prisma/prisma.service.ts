import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  static readonly MAX_RETRIES = process.env.DB_MAX_RETRIES ? parseInt(process.env.DB_MAX_RETRIES, 10) : 5;
  static readonly RETRY_BASE_DELAY_MS = process.env.DB_RETRY_BASE_DELAY_MS
    ? parseInt(process.env.DB_RETRY_BASE_DELAY_MS, 10)
    : 1000;

  async onModuleInit(): Promise<void> {
    for (let attempt = 1; attempt <= PrismaService.MAX_RETRIES; attempt++) {
      try {
        await this.$connect();
        return;
      } catch (error) {
        if (attempt === PrismaService.MAX_RETRIES) {
          this.logger.error(`Database connection failed after ${PrismaService.MAX_RETRIES} attempts`);
          throw error;
        }
        const delay = PrismaService.RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        this.logger.warn(`Database connection attempt ${attempt} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
