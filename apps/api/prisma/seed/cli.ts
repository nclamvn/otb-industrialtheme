#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { seed, SeedType } from './index';
import { ExcelReader } from './parsers/excel-reader';
import { logger } from './utils/logger';

const program = new Command();

program
  .name('seed')
  .description('Database seeding CLI for DAFC OTB Platform')
  .version('1.0.0');

program
  .command('run')
  .description('Run database seeding')
  .option('-t, --type <type>', 'Seed type: all, master, size, planning, performance', 'all')
  .option('--dry-run', 'Validate data without inserting')
  .action(async (options) => {
    console.log(chalk.cyan(`\n🌱 Running seed: ${options.type}\n`));

    if (options.dryRun) {
      console.log(chalk.yellow('⚠️  Dry run mode - no data will be inserted\n'));
      // TODO: Implement dry run validation
      return;
    }

    try {
      await seed(options.type as SeedType);
    } catch (error) {
      console.error(chalk.red('Seeding failed:'), error);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List available Excel files')
  .action(() => {
    const reader = new ExcelReader();
    const files = reader.listExcelFiles();

    console.log(chalk.cyan('\n📁 Available Excel files:\n'));

    if (files.length === 0) {
      console.log(chalk.yellow('  No Excel files found in data directory'));
      console.log(chalk.gray('  Expected location: apps/api/prisma/seed/data/'));
    } else {
      files.forEach((file) => {
        console.log(chalk.white(`  • ${file}`));
      });
    }
    console.log('');
  });

program
  .command('validate <file>')
  .description('Validate an Excel file')
  .action(async (file) => {
    const reader = new ExcelReader();

    if (!reader.fileExists(file)) {
      console.log(chalk.red(`\n❌ File not found: ${file}\n`));
      process.exit(1);
    }

    console.log(chalk.cyan(`\n📊 Validating: ${file}\n`));

    try {
      const data = await reader.readExcelJS(file);

      data.sheets.forEach((sheet) => {
        console.log(chalk.white(`\nSheet: ${sheet.name}`));
        console.log(chalk.gray(`  Headers: ${sheet.headers.join(', ')}`));
        console.log(chalk.gray(`  Rows: ${sheet.rows.length}`));

        if (sheet.rows.length > 0) {
          console.log(chalk.gray(`  Sample row:`));
          console.log(chalk.gray(`    ${JSON.stringify(sheet.rows[0], null, 2)}`));
        }
      });

      console.log(chalk.green('\n✅ File is valid\n'));
    } catch (error) {
      console.log(chalk.red(`\n❌ Validation failed: ${error}\n`));
      process.exit(1);
    }
  });

program
  .command('reset')
  .description('Reset database (delete all seeded data)')
  .option('--confirm', 'Confirm reset without prompt')
  .action(async (options) => {
    if (!options.confirm) {
      console.log(chalk.red('\n⚠️  This will DELETE seeded data in the database!'));
      console.log(chalk.yellow('Use --confirm to proceed\n'));
      return;
    }

    console.log(chalk.red('\n🗑️  Resetting seeded data...\n'));

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Delete in reverse order of dependencies
      logger.start('Deleting Store Performance...');
      await prisma.storePerformance.deleteMany();
      logger.succeed('Store Performance deleted');

      logger.start('Deleting Budget Allocations...');
      await prisma.budgetAllocation.deleteMany();
      logger.succeed('Budget Allocations deleted');

      logger.start('Deleting Size Profile Items...');
      await prisma.sizeProfileItem.deleteMany();
      logger.succeed('Size Profile Items deleted');

      logger.start('Deleting Size Profiles...');
      await prisma.sizeProfile.deleteMany();
      logger.succeed('Size Profiles deleted');

      logger.start('Deleting Size Definitions...');
      await prisma.sizeDefinition.deleteMany();
      logger.succeed('Size Definitions deleted');

      logger.start('Deleting Sales Locations...');
      await prisma.salesLocation.deleteMany();
      logger.succeed('Sales Locations deleted');

      logger.start('Deleting Categories...');
      await prisma.category.deleteMany();
      logger.succeed('Categories deleted');

      logger.start('Deleting Brands...');
      await prisma.brand.deleteMany();
      logger.succeed('Brands deleted');

      logger.start('Deleting Divisions...');
      await prisma.division.deleteMany();
      logger.succeed('Divisions deleted');

      logger.start('Deleting Seasons...');
      await prisma.season.deleteMany();
      logger.succeed('Seasons deleted');

      console.log(chalk.green('\n✅ Database reset complete\n'));
    } catch (error) {
      console.log(chalk.red(`\n❌ Reset failed: ${error}\n`));
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

// Default command
program
  .argument('[type]', 'Seed type: all, master, size, planning, performance', 'all')
  .action(async (type) => {
    try {
      await seed(type as SeedType);
    } catch (error) {
      console.error(chalk.red('Seeding failed:'), error);
      process.exit(1);
    }
  });

program.parse();
