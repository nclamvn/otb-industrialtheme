import { PrismaClient } from '@prisma/client';
import { logger, SeedResult } from '../utils/logger';
import { BudgetSeeder } from './budget.seeder';

export class PlanningDataSeeder {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async seed(): Promise<SeedResult[]> {
    logger.header('SEEDING PLANNING DATA');

    const results: SeedResult[] = [];

    const budgetSeeder = new BudgetSeeder(this.prisma);
    results.push(await budgetSeeder.seed());

    return results;
  }
}
