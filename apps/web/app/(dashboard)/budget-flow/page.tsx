'use client';

import { useState } from 'react';
import { BudgetFlowView } from '@/components/budget-flow';
import { BudgetNode } from '@/components/budget-flow/types';

// Mock data - replace with actual API call
const mockBudgetData: BudgetNode = {
  id: 'root',
  name: 'FY 2026 Spring Summer',
  level: 0,
  budget: 1886500,
  allocated: 1750000,
  percentage: 1,
  status: 'verified',
  metadata: {
    seasonYear: 'SS26',
  },
  children: [
    {
      id: 'rex',
      name: 'REX',
      level: 1,
      budget: 1037575,
      allocated: 950000,
      percentage: 0.55,
      status: 'verified',
      children: [
        {
          id: 'rex-male',
          name: 'Male',
          level: 2,
          budget: 600000,
          allocated: 580000,
          percentage: 0.578,
          status: 'verified',
          children: [
            {
              id: 'rex-male-outerwear',
              name: 'Outerwear',
              level: 3,
              budget: 200000,
              allocated: 195000,
              percentage: 0.333,
              status: 'verified',
              children: [
                {
                  id: 'rex-male-outerwear-coat',
                  name: 'Wool Coat A2501',
                  level: 4,
                  budget: 70000,
                  allocated: 70000,
                  percentage: 0.35,
                  status: 'verified',
                },
                {
                  id: 'rex-male-outerwear-jacket',
                  name: 'Down Jacket B3201',
                  level: 4,
                  budget: 60000,
                  allocated: 58000,
                  percentage: 0.30,
                  status: 'draft',
                },
                {
                  id: 'rex-male-outerwear-blazer',
                  name: 'Blazer C1501',
                  level: 4,
                  budget: 45000,
                  allocated: 45000,
                  percentage: 0.225,
                  status: 'verified',
                },
              ],
            },
            {
              id: 'rex-male-tops',
              name: 'Tops',
              level: 3,
              budget: 150000,
              allocated: 145000,
              percentage: 0.25,
              status: 'draft',
            },
            {
              id: 'rex-male-bottoms',
              name: 'Bottoms',
              level: 3,
              budget: 120000,
              allocated: 120000,
              percentage: 0.2,
              status: 'verified',
            },
            {
              id: 'rex-male-accessories',
              name: 'Accessories',
              level: 3,
              budget: 130000,
              allocated: 120000,
              percentage: 0.217,
              status: 'warning',
            },
          ],
        },
        {
          id: 'rex-female',
          name: 'Female',
          level: 2,
          budget: 400000,
          allocated: 350000,
          percentage: 0.385,
          status: 'draft',
          children: [
            {
              id: 'rex-female-dresses',
              name: 'Dresses',
              level: 3,
              budget: 100000,
              allocated: 95000,
              percentage: 0.25,
              status: 'verified',
            },
            {
              id: 'rex-female-outerwear',
              name: 'Outerwear',
              level: 3,
              budget: 150000,
              allocated: 140000,
              percentage: 0.375,
              status: 'draft',
            },
            {
              id: 'rex-female-tops',
              name: 'Tops',
              level: 3,
              budget: 150000,
              allocated: 115000,
              percentage: 0.375,
              status: 'warning',
            },
          ],
        },
        {
          id: 'rex-unisex',
          name: 'Unisex',
          level: 2,
          budget: 37575,
          allocated: 20000,
          percentage: 0.037,
          status: 'error',
        },
      ],
    },
    {
      id: 'ttp',
      name: 'TTP',
      level: 1,
      budget: 848925,
      allocated: 800000,
      percentage: 0.45,
      status: 'draft',
      children: [
        {
          id: 'ttp-male',
          name: 'Male',
          level: 2,
          budget: 500000,
          allocated: 480000,
          percentage: 0.59,
          status: 'verified',
        },
        {
          id: 'ttp-female',
          name: 'Female',
          level: 2,
          budget: 348925,
          allocated: 320000,
          percentage: 0.41,
          status: 'draft',
        },
      ],
    },
  ],
};

export default function BudgetFlowPage() {
  const [budgetData] = useState<BudgetNode>(mockBudgetData);

  const handleNodeUpdate = (id: string, data: Partial<BudgetNode>) => {
    console.log('Update node:', id, data);
  };

  const handleExport = () => {
    console.log('Export budget data');
  };

  const handleRefresh = () => {
    console.log('Refresh data');
  };

  return (
    <div className="min-h-screen">
      <BudgetFlowView
        data={budgetData}
        onNodeUpdate={handleNodeUpdate}
        onExport={handleExport}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
