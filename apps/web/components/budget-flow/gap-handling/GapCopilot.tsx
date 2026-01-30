'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BudgetNode } from '../types';
import { GapAnalyzer } from './GapAnalyzer';
import { AISuggestionPanel } from './AISuggestionPanel';
import { AISuggestion, SuggestionAction } from './types';
import {
  Sparkles,
  BarChart3,
  X,
  Maximize2,
  Minimize2,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GapCopilotProps {
  data: BudgetNode;
  isOpen: boolean;
  onClose: () => void;
  onBudgetUpdate?: (nodeId: string, newBudget: number) => void;
  onNodeSelect?: (nodeId: string) => void;
}

export function GapCopilot({
  data,
  isOpen,
  onClose,
  onBudgetUpdate,
  onNodeSelect,
}: GapCopilotProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('suggestions');

  // Handle applying a suggestion
  const handleApplySuggestion = async (suggestion: AISuggestion) => {
    if (!onBudgetUpdate) return;

    // Apply each action
    for (const action of suggestion.actions) {
      onBudgetUpdate(action.nodeId, action.newValue);
    }

    // Add a small delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 300));
  };

  // Handle applying a single action
  const handleApplyAction = (action: SuggestionAction) => {
    if (!onBudgetUpdate) return;
    onBudgetUpdate(action.nodeId, action.newValue);
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full bg-white border-l shadow-2xl z-50 flex flex-col transition-all duration-300',
        isExpanded ? 'w-[600px]' : 'w-[420px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-200">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Gap Copilot</h3>
            <p className="text-xs text-slate-500">AI-powered budget optimization</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8"
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="grid w-full grid-cols-2 p-1 m-4 mb-0 bg-slate-100 rounded-lg">
          <TabsTrigger
            value="suggestions"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            AI Suggestions
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <BarChart3 className="h-4 w-4" />
            Gap Analysis
          </TabsTrigger>
        </TabsList>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="suggestions" className="mt-0 h-full">
            <AISuggestionPanel
              data={data}
              onApplySuggestion={handleApplySuggestion}
              onApplyAction={handleApplyAction}
            />
          </TabsContent>

          <TabsContent value="analysis" className="mt-0 h-full">
            <GapAnalyzer
              data={data}
              onNodeSelect={onNodeSelect}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer */}
      <div className="p-4 border-t bg-slate-50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MessageSquare className="w-4 h-4" />
          <span>
            Need help? Ask the{' '}
            <button className="text-amber-600 hover:underline font-medium">
              DAFC Copilot
            </button>{' '}
            for personalized advice.
          </span>
        </div>
      </div>
    </div>
  );
}

export default GapCopilot;
