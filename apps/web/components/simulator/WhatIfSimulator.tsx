'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import {
  Calculator,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Types
interface SimulatorField {
  id: string;
  label: string;
  currentValue: number;
  format: 'currency' | 'percent' | 'number';
  min?: number;
  max?: number;
  step?: number;
}

interface SimulatorResult {
  label: string;
  currentValue: number;
  simulatedValue: number;
  format: 'currency' | 'percent' | 'number';
}

interface WhatIfSimulatorProps {
  title: string;
  description?: string;
  fields: SimulatorField[];
  calculate: (inputs: Record<string, number>) => SimulatorResult[];
  onApply?: (inputs: Record<string, number>) => void;
  className?: string;
}

// Format value helper
const formatValue = (v: number, format: string) => {
  switch (format) {
    case 'currency':
      if (v >= 1e9) return `₫${(v / 1e9).toFixed(1)}B`;
      if (v >= 1e6) return `₫${(v / 1e6).toFixed(1)}M`;
      return `₫${v.toLocaleString('vi-VN')}`;
    case 'percent':
      return `${v.toFixed(1)}%`;
    default:
      return v.toLocaleString('vi-VN');
  }
};

export function WhatIfSimulator({
  title,
  description,
  fields,
  calculate,
  onApply,
  className,
}: WhatIfSimulatorProps) {
  const t = useTranslations('common');

  const [inputs, setInputs] = useState<Record<string, number>>(
    Object.fromEntries(fields.map((f) => [f.id, f.currentValue]))
  );
  const [isChanged, setIsChanged] = useState(false);

  const results = useMemo(() => calculate(inputs), [inputs, calculate]);

  const handleChange = (fieldId: string, value: number) => {
    setInputs((prev) => ({ ...prev, [fieldId]: value }));
    setIsChanged(true);
  };

  const handleReset = () => {
    setInputs(Object.fromEntries(fields.map((f) => [f.id, f.currentValue])));
    setIsChanged(false);
  };

  const handleApply = () => {
    if (onApply) {
      onApply(inputs);
      setIsChanged(false);
    }
  };

  return (
    <Card
      className={cn(
        'border-[#B8860B]/30 bg-gradient-to-br from-[#B8860B]/5 to-background',
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#B8860B]/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4" style={{ color: '#B8860B' }} />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>
                {description || 'Điều chỉnh thông số để xem kết quả dự kiến'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isChanged && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 text-xs gap-1.5"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            )}
            {isChanged && onApply && (
              <Button
                size="sm"
                onClick={handleApply}
                className="h-8 text-xs gap-1.5 bg-[#127749] hover:bg-[#0d5a36]"
              >
                <Save className="h-3 w-3" />
                Áp dụng
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid md:grid-cols-2 gap-6">
        {/* Input Fields */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Thông số đầu vào
          </h4>
          {fields.map((field) => {
            const changed = inputs[field.id] !== field.currentValue;
            return (
              <div key={field.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    {field.label}
                  </label>
                  {changed && (
                    <span
                      className="text-[9px] font-semibold"
                      style={{ color: '#B8860B' }}
                    >
                      ĐÃ THAY ĐỔI
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[inputs[field.id]]}
                    min={field.min ?? 0}
                    max={field.max ?? field.currentValue * 2}
                    step={field.step ?? 1}
                    onValueChange={([value]) => handleChange(field.id, value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={inputs[field.id]}
                    onChange={(e) =>
                      handleChange(field.id, parseFloat(e.target.value) || 0)
                    }
                    className="w-24 h-8 text-xs font-mono text-right"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    Hiện tại: {formatValue(field.currentValue, field.format)}
                  </span>
                  {changed && (
                    <span style={{ color: '#B8860B' }}>
                      → {formatValue(inputs[field.id], field.format)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Results */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Kết quả dự kiến
          </h4>
          {results.map((result, idx) => {
            const diff = result.simulatedValue - result.currentValue;
            const pctChange =
              result.currentValue !== 0
                ? (diff / result.currentValue) * 100
                : 0;
            const isPositive = diff >= 0;

            return (
              <div
                key={idx}
                className="p-3 rounded-lg border border-border bg-background"
              >
                <span className="text-xs text-muted-foreground">
                  {result.label}
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-mono text-muted-foreground line-through">
                    {formatValue(result.currentValue, result.format)}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span
                    className={cn(
                      'text-sm font-mono font-bold',
                      isPositive ? 'text-[#127749]' : 'text-red-600'
                    )}
                  >
                    {formatValue(result.simulatedValue, result.format)}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1',
                      isPositive
                        ? 'bg-[#127749]/10 text-[#127749]'
                        : 'bg-red-100 text-red-600'
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {isPositive ? '+' : ''}
                    {pctChange.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
