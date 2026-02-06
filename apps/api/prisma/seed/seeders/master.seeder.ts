import { PrismaClient } from '@prisma/client';
import { logger, SeedResult } from '../utils/logger';
import { SeasonSeeder } from './season.seeder';
import { DivisionSeeder } from './division.seeder';
import { BrandSeeder } from './brand.seeder';
import { CategorySeeder } from './category.seeder';
import { LocationSeeder } from './location.seeder';

export class MasterDataSeeder {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async seed(): Promise<SeedResult[]> {
    logger.header('SEEDING MASTER DATA');

    const results: SeedResult[] = [];

    // Seed in order of dependencies
    const seeders = [
      new SeasonSeeder(this.prisma),
      new DivisionSeeder(this.prisma),
      new BrandSeeder(this.prisma),    // Depends on Division
      new CategorySeeder(this.prisma),
      new LocationSeeder(this.prisma),
    ];

    for (const seeder of seeders) {
      const result = await seeder.seed();
      results.push(result);
    }

    return results;
  }
}
