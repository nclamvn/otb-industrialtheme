'use client';

import React, { useState } from 'react';
import { Map, Layers } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DrillDownBreadcrumb, BreadcrumbItem } from './DrillDownBreadcrumb';
import { EntityNavigator, generateMockHierarchy } from './EntityNavigator';
import { useQuickPreview } from '@/components/preview';

export function NavigationDemo() {
  const { openPreview } = useQuickPreview();
  const [selectedSeason, setSelectedSeason] = useState<string>('ss25');
  const [selectedBrand, setSelectedBrand] = useState<string>('brand1');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const hierarchy = generateMockHierarchy();

  // Build breadcrumb based on selections
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/', type: 'home' },
    { label: 'OTB Analysis', href: '/otb-analysis', type: 'page' },
  ];

  if (selectedSeason) {
    const season = hierarchy.seasons.find((s) => s.id === selectedSeason);
    if (season) {
      breadcrumbItems.push({
        label: season.code,
        href: `/otb-analysis?season=${season.id}`,
        type: 'season',
        id: season.id,
        siblings: hierarchy.seasons.map((s) => ({
          label: s.code,
          href: `/otb-analysis?season=${s.id}`,
          id: s.id,
        })),
      });
    }
  }

  if (selectedBrand) {
    const brand = hierarchy.brands.find((b) => b.id === selectedBrand);
    if (brand) {
      breadcrumbItems.push({
        label: brand.name,
        href: `/otb-analysis?season=${selectedSeason}&brand=${brand.id}`,
        type: 'brand',
        id: brand.id,
        siblings: hierarchy.brands.map((b) => ({
          label: b.name,
          href: `/otb-analysis?season=${selectedSeason}&brand=${b.id}`,
          id: b.id,
        })),
      });
    }
  }

  if (selectedCategory) {
    const category = hierarchy.categories.find((c) => c.id === selectedCategory);
    if (category) {
      breadcrumbItems.push({
        label: category.name,
        type: 'category',
        id: category.id,
      });
    }
  }

  const handleEntitySelect = (type: string, id: string) => {
    switch (type) {
      case 'season':
        setSelectedSeason(id);
        setSelectedBrand('');
        setSelectedCategory(undefined);
        break;
      case 'brand':
        setSelectedBrand(id);
        setSelectedCategory(undefined);
        break;
      case 'category':
        setSelectedCategory(id);
        break;
      case 'sku':
        openPreview('sku', id);
        break;
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Breadcrumb Demo */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5 text-[#D7B797]" />
            Drill-Down Breadcrumb
          </CardTitle>
          <CardDescription>
            Navigate through the hierarchy with context-aware dropdowns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Breadcrumb */}
          <div className="p-3 rounded-lg border bg-muted/30">
            <DrillDownBreadcrumb items={breadcrumbItems} showIcons />
          </div>

          {/* Selection Info */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-lg border bg-[#D7B797]/10">
              <p className="text-xs text-muted-foreground mb-1">Selected Season</p>
              <p className="font-semibold">
                {hierarchy.seasons.find((s) => s.id === selectedSeason)?.code || 'None'}
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-[#127749]/10">
              <p className="text-xs text-muted-foreground mb-1">Selected Brand</p>
              <p className="font-semibold">
                {hierarchy.brands.find((b) => b.id === selectedBrand)?.name || 'None'}
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-blue-500/10">
              <p className="text-xs text-muted-foreground mb-1">Selected Category</p>
              <p className="font-semibold">
                {hierarchy.categories.find((c) => c.id === selectedCategory)?.name || 'None'}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Click on breadcrumb items with dropdowns to switch between siblings.
            State persists across navigation.
          </p>
        </CardContent>
      </Card>

      {/* Entity Navigator Demo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="w-4 h-4 text-[#127749]" />
            Entity Navigator
          </CardTitle>
          <CardDescription className="text-xs">
            Hierarchical tree navigation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <EntityNavigator
            hierarchy={hierarchy}
            selectedSeason={selectedSeason}
            selectedBrand={selectedBrand}
            selectedCategory={selectedCategory}
            onSelect={handleEntitySelect}
            showSKUs
            className="border-0 rounded-none h-[350px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
