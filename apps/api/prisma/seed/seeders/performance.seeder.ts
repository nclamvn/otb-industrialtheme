import { PrismaClient } from '@prisma/client';
import { logger, SeedResult } from '../utils/logger';
import { StorePerformanceSeeder } from './store-performance.seeder';

export class PerformanceDataSeeder {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async seed(): Promise<SeedResult[]> {
    logger.header('SEEDING PERFORMANCE DATA');

    const results: SeedResult[] = [];

    const performanceSeeder = new StorePerformanceSeeder(this.prisma);
    results.push(await performanceSeeder.seed());

    return results;
  }
}
