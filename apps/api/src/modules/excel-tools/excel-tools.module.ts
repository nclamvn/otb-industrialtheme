/**
 * Excel Tools Module
 * NL Formula Engine + Data Cleaner API Module
 */

import { Module } from '@nestjs/common';
import { ExcelToolsController } from './excel-tools.controller';
import { ExcelToolsService } from './excel-tools.service';

@Module({
  controllers: [ExcelToolsController],
  providers: [ExcelToolsService],
  exports: [ExcelToolsService],
})
export class ExcelToolsModule {}
