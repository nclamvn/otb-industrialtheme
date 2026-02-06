import chalk from 'chalk';
import ora, { Ora } from 'ora';

export interface SeedResult {
  entity: string;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  errorMessages?: string[];
}

export class SeedLogger {
  private spinner: Ora | null = null;
  private startTime: number = 0;

  start(message: string): void {
    this.startTime = Date.now();
    this.spinner = ora({
      text: message,
      color: 'cyan',
    }).start();
  }

  succeed(message?: string): void {
    if (this.spinner) {
      const duration = Date.now() - this.startTime;
      this.spinner.succeed(
        message ? `${message} ${chalk.gray(`(${duration}ms)`)}` : undefined
      );
      this.spinner = null;
    }
  }

  fail(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }

  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  warn(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  error(message: string): void {
    console.log(chalk.red('✗'), message);
  }

  table(data: Record<string, any>[]): void {
    console.table(data);
  }

  divider(): void {
    console.log(chalk.gray('─'.repeat(60)));
  }

  header(title: string): void {
    console.log('\n');
    console.log(chalk.cyan.bold('═'.repeat(60)));
    console.log(chalk.cyan.bold(`  ${title}`));
    console.log(chalk.cyan.bold('═'.repeat(60)));
    console.log('');
  }

  summary(results: SeedResult[]): void {
    this.divider();
    console.log(chalk.bold('\n📊 SEED SUMMARY\n'));

    const tableData = results.map(r => ({
      Entity: r.entity,
      Created: chalk.green(r.created.toString()),
      Updated: chalk.yellow(r.updated.toString()),
      Skipped: chalk.gray(r.skipped.toString()),
      Errors: r.errors > 0 ? chalk.red(r.errors.toString()) : chalk.gray(r.errors.toString()),
    }));

    console.table(tableData);

    const totals = results.reduce(
      (acc, r) => ({
        created: acc.created + r.created,
        updated: acc.updated + r.updated,
        skipped: acc.skipped + r.skipped,
        errors: acc.errors + r.errors,
      }),
      { created: 0, updated: 0, skipped: 0, errors: 0 }
    );

    console.log('\nTotals:');
    console.log(`  Created: ${chalk.green(totals.created.toString())}`);
    console.log(`  Updated: ${chalk.yellow(totals.updated.toString())}`);
    console.log(`  Skipped: ${chalk.gray(totals.skipped.toString())}`);
    console.log(`  Errors:  ${totals.errors > 0 ? chalk.red(totals.errors.toString()) : chalk.gray(totals.errors.toString())}`);
    this.divider();
  }
}

export const logger = new SeedLogger();
