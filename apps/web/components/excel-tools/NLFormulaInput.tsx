'use client';

/**
 * NL Formula Input Component
 * Vietnamese natural language input with formula suggestions
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2, Sparkles, Copy, Check, Calculator } from 'lucide-react';

interface FormulaSuggestion {
  formula: string;
  description: string;
  confidence: number;
}

interface FormulaIntent {
  type: string;
  confidence: number;
  fields: string[];
  description?: string;
}

interface FormulaResult {
  success: boolean;
  formula: string;
  intent: FormulaIntent;
  executionTime: number;
}

interface NLFormulaInputProps {
  onFormulaGenerated?: (formula: string, intent: FormulaIntent) => void;
  placeholder?: string;
  className?: string;
  context?: Record<string, unknown>;
  showSuggestions?: boolean;
  autoConvert?: boolean;
}

export function NLFormulaInput({
  onFormulaGenerated,
  placeholder: customPlaceholder,
  className = '',
  context,
  showSuggestions = true,
  autoConvert = false,
}: NLFormulaInputProps) {
  const t = useTranslations('excelTools.nlFormula');
  const placeholder = customPlaceholder || t('placeholder');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FormulaResult | null>(null);
  const [suggestions, setSuggestions] = useState<FormulaSuggestion[]>([]);
  const [showSuggestionsPopover, setShowSuggestionsPopover] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Fetch suggestions as user types
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!showSuggestions || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/excel-tools/nl-formula/suggestions?query=${encodeURIComponent(query)}&limit=5`
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestionsPopover(data.suggestions?.length > 0);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  }, [showSuggestions]);

  // Debounced input handler
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (input.trim()) {
        fetchSuggestions(input);
        if (autoConvert) {
          handleConvert();
        }
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [input, fetchSuggestions, autoConvert]);

  // Convert input to formula
  const handleConvert = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setShowSuggestionsPopover(false);

    try {
      const response = await fetch('/api/excel-tools/nl-formula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input.trim(),
          context,
          returnAlternatives: true,
        }),
      });

      if (response.ok) {
        const data: FormulaResult = await response.json();
        setResult(data);

        if (data.success && onFormulaGenerated) {
          onFormulaGenerated(data.formula, data.intent);
        }
      }
    } catch (error) {
      console.error('Failed to convert formula:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: FormulaSuggestion) => {
    setResult({
      success: true,
      formula: suggestion.formula,
      intent: {
        type: 'SUGGESTION',
        confidence: suggestion.confidence,
        fields: [],
        description: suggestion.description,
      },
      executionTime: 0,
    });
    setShowSuggestionsPopover(false);

    if (onFormulaGenerated) {
      onFormulaGenerated(suggestion.formula, {
        type: 'SUGGESTION',
        confidence: suggestion.confidence,
        fields: [],
        description: suggestion.description,
      });
    }
  };

  // Copy formula to clipboard
  const handleCopy = async () => {
    if (result?.formula) {
      await navigator.clipboard.writeText(result.formula);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConvert();
    }
    if (e.key === 'Escape') {
      setShowSuggestionsPopover(false);
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-green-500';
    if (confidence >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5" />
          NL Formula Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="flex gap-2">
          <Popover open={showSuggestionsPopover} onOpenChange={setShowSuggestionsPopover}>
            <PopoverTrigger asChild>
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="pr-10"
                />
                {isLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <div className="p-2">
                <p className="text-sm text-muted-foreground mb-2">{t('suggestions')}</p>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono text-primary">
                          {suggestion.formula}
                        </code>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(suggestion.confidence * 100)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={handleConvert} disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">{t('convert')}</span>
          </Button>
        </div>

        {/* Result Section */}
        {result && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t('formula')}:</span>
                  <Badge
                    variant="outline"
                    className={`${getConfidenceColor(result.intent.confidence)} text-white border-0`}
                  >
                    {Math.round(result.intent.confidence * 100)}% {t('confidence')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">
                    {result.formula}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Intent Info */}
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">{result.intent.type}</Badge>
              {result.intent.fields.map((field, i) => (
                <Badge key={i} variant="outline">
                  {field}
                </Badge>
              ))}
              {result.executionTime > 0 && (
                <span className="text-muted-foreground">
                  {result.executionTime}ms
                </span>
              )}
            </div>

            {/* Description */}
            {result.intent.description && (
              <p className="text-sm text-muted-foreground">
                {result.intent.description}
              </p>
            )}
          </div>
        )}

        {/* Quick Examples */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">{t('examples')}</p>
          <div className="flex flex-wrap gap-1">
            {(t.raw('exampleFormulas') as string[]).map(
              (example) => (
                <button
                  key={example}
                  onClick={() => setInput(example)}
                  className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  {example}
                </button>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default NLFormulaInput;
