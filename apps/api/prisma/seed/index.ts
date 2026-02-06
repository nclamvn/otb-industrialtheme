import { PrismaClient } from '@prisma/client';
import { logger, SeedResult } from './utils/logger';
import { MasterDataSeeder } from './seeders/master.seeder';
import { SizeDefinitionSeeder } from './seeders/size-definition.seeder';
import { SizeProfileSeeder } from './seeders/size-profile.seeder';
import { PlanningDataSeeder } from './seeders/planning.seeder';
import { PerformanceDataSeeder } from './seeders/performance.seeder';

const prisma = new PrismaClient();

export type SeedType = 'all' | 'master' | 'size' | 'planning' | 'performance';

export async function seed(type: SeedType = 'all'): Promise<void> {
  const startTime = Date.now();
  const allResults: SeedResult[] = [];

  logger.header('DATABASE SEEDING');
  logger.info(`Seed type: ${type}`);
  logger.divider();

  try {
    // Master data (always first)
    if (type === 'all' || type === 'master') {
      const masterSeeder = new MasterDataSeeder(prisma);
      allResults.push(...await masterSeeder.seed());

      // Size definitions (part of master data)
      const sizeDefSeeder = new SizeDefinitionSeeder(prisma);
      allResults.push(await sizeDefSeeder.seed());
    }

    // Size profiles (depends on categories and size definitions)
    if (type === 'all' || type === 'size') {
      const sizeProfileSeeder = new SizeProfileSeeder(prisma);
      allResults.push(await sizeProfileSeeder.seed());
    }

    // Planning data (depends on master)
    if (type === 'all' || type === 'planning') {
      const planningSeeder = new PlanningDataSeeder(prisma);
      allResults.push(...await planningSeeder.seed());
    }

    // Performance data (depends on master)
    if (type === 'all' || type === 'performance') {
      const performanceSeeder = new PerformanceDataSeeder(prisma);
      allResults.push(...await performanceSeeder.seed());
    }

    // Summary
    logger.summary(allResults);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.success(`\n✨ Seeding completed in ${duration}s\n`);

  } catch (error) {
    logger.error(`Seeding failed: ${error}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  const type = (process.argv[2] as SeedType) || 'all';
  seed(type)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
