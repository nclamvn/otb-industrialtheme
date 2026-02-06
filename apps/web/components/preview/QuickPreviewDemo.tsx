'use client';

import React from 'react';
import { Eye, Package, DollarSign, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuickPreview } from './QuickPreviewPanel';

export function QuickPreviewDemo() {
  const { openPreview } = useQuickPreview();

  const demoItems = [
    {
      type: 'budget' as const,
      id: 'budget-001',
      title: 'SS25 Budget',
      description: 'Spring/Summer 2025 Budget Overview',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      type: 'otb' as const,
      id: 'otb-001',
      title: 'Women\'s OTB Plan',
      description: 'SS25 Women\'s Collection Allocation',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      type: 'sku' as const,
      id: 'sku-001',
      title: 'Classic Leather Tote',
      description: 'SKU: WB-SS25-0042',
      icon: ShoppingBag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-[#D7B797]" />
          Quick Preview Demo
        </CardTitle>
        <CardDescription>
          Click on any item to open a slide-over preview panel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {demoItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => openPreview(item.type, item.id)}
                className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-left group"
              >
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
                <Eye className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
