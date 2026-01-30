import { Module } from '@nestjs/common';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { BudgetTreeService } from './services/budget-tree.service';
import { GapAnalysisService } from './services/gap-analysis.service';
import { BudgetSuggestionsService } from './services/budget-suggestions.service';
import { BudgetVersionsService } from './services/budget-versions.service';

@Module({
  controllers: [BudgetsController],
  providers: [
    BudgetsService,
    BudgetTreeService,
    GapAnalysisService,
    BudgetSuggestionsService,
    BudgetVersionsService,
  ],
  exports: [
    BudgetsService,
    BudgetTreeService,
    GapAnalysisService,
    BudgetSuggestionsService,
    BudgetVersionsService,
  ],
})
export class BudgetsModule {}
