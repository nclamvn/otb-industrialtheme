'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Building2,
  DollarSign,
  ChevronDown,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { usePlanningContext } from '@/contexts/PlanningContext';
import { AISuggestionPanel } from '@/components/budget-flow/gap-handling/AISuggestionPanel';

export function PlanningContextBar() {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const {
    selectedSeason,
    selectedBrand,
    budgetSummary,
    availableSeasons,
    availableBrands,
    setSelectedSeason,
    setSelectedBrand,
    clearContext,
    isLoading,
  } = usePlanningContext();

  // Show minimal bar with selectors if no context
  const hasContext = selectedSeason || selectedBrand;

  const utilizationPct = budgetSummary
    ? Math.round((budgetSummary.allocated / budgetSummary.total) * 100)
    : 0;

  return (
    <div className="bg-muted/30 border-b px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        {/* Season Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
              <Calendar className="w-3 h-3 text-[#D7B797]" />
              <span className="font-medium">
                {selectedSeason?.code || 'Select Season'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Active Seasons</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableSeasons.map((season) => (
              <DropdownMenuItem
                key={season.id}
                onClick={() => setSelectedSeason(season)}
                className={cn(
                  selectedSeason?.id === season.id && 'bg-[#D7B797]/10'
                )}
              >
                <span className="font-mono mr-2">{season.code}</span>
                <span className="text-muted-foreground">{season.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="w-px h-4 bg-border" />

        {/* Brand Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
              <Building2 className="w-3 h-3 text-[#127749]" />
              <span className="font-medium">
                {selectedBrand?.name || 'Select Brand'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Brands</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableBrands.map((brand) => (
              <DropdownMenuItem
                key={brand.id}
                onClick={() => setSelectedBrand(brand)}
                className={cn(
                  selectedBrand?.id === brand.id && 'bg-[#127749]/10'
                )}
              >
                {brand.code && (
                  <span className="font-mono mr-2 text-muted-foreground">
                    {brand.code}
                  </span>
                )}
                <span>{brand.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Budget Summary (if available) */}
        {hasContext && budgetSummary && (
          <>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-xs">
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-mono font-medium">
                    ${(budgetSummary.total / 1000000).toFixed(1)}M
                  </span>
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        utilizationPct > 95 ? 'bg-red-500' :
                        utilizationPct > 80 ? 'bg-amber-500' :
                        'bg-[#127749]'
                      )}
                      style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                    />
                  </div>
                  <span className={cn(
                    'font-mono text-[10px]',
                    utilizationPct > 95 ? 'text-red-500' :
                    utilizationPct > 80 ? 'text-amber-500' :
                    'text-[#127749]'
                  )}>
                    {utilizationPct}%
                  </span>
                </>
              )}
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Context Badge */}
        {selectedSeason && selectedBrand && (
          <Badge variant="secondary" className="text-[10px] h-5 gap-1">
            <span className="font-mono">{selectedSeason.code}</span>
            <span className="text-muted-foreground">•</span>
            <span>{selectedBrand.name}</span>
          </Badge>
        )}

        {/* AI Quick Action */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-[#D7B797]"
          onClick={() => setAiPanelOpen(true)}
        >
          <Sparkles className="w-3 h-3" />
          <span className="hidden sm:inline">AI Suggest</span>
        </Button>

        {/* AI Suggestions Sheet */}
        <Sheet open={aiPanelOpen} onOpenChange={setAiPanelOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D7B797]" />
                AI Suggestions
              </SheetTitle>
              <SheetDescription>
                Gợi ý tối ưu hóa ngân sách dựa trên phân tích AI
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <AISuggestionPanel
                budgetId={selectedSeason?.id}
                data={{
                  id: 'root',
                  name: selectedBrand?.name || 'All Brands',
                  level: 0,
                  budget: budgetSummary?.total || 0,
                  allocated: budgetSummary?.allocated || 0,
                  percentage: budgetSummary?.total
                    ? (budgetSummary.allocated / budgetSummary.total) * 100
                    : 0,
                  status: 'verified',
                  children: [],
                }}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Clear Context */}
        {hasContext && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={clearContext}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
