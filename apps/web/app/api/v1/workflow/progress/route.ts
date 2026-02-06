import { NextResponse } from 'next/server';

interface StepProgress {
  version?: number;
  versionStatus?: 'draft' | 'final';
  itemCount?: number;
  totalValue?: number;
  lastModified?: string;
  hasWarning?: boolean;
  warningMessage?: string;
}

interface ActiveSeason {
  id: string;
  code: string;
  brand: string;
}

interface WorkflowProgressData {
  progress: Record<string, StepProgress>;
  activeSeasons: ActiveSeason[];
}

// GET /api/v1/workflow/progress - Get workflow progress data
export async function GET() {
  // Return mock data for demo purposes
  // In production, connect to actual database queries
  const mockData: WorkflowProgressData = {
    progress: {
      budget: {
        version: 2,
        versionStatus: 'final',
        itemCount: 12,
        totalValue: 5200000,
        lastModified: new Date().toISOString(),
      },
      otb: {
        version: 3,
        versionStatus: 'draft',
        itemCount: 45,
        totalValue: 4800000,
        lastModified: new Date().toISOString(),
      },
      sku: {
        version: 1,
        versionStatus: 'draft',
        itemCount: 156,
        totalValue: 3200000,
        lastModified: new Date().toISOString(),
        hasWarning: true,
        warningMessage: '12 SKUs missing size breakdown',
      },
      sizing: { itemCount: 0 },
      ticket: {},
      approval: {},
    },
    activeSeasons: [
      { id: '1', code: 'SS25', brand: 'Ferragamo' },
      { id: '2', code: 'SS25', brand: 'TODs' },
    ],
  };

  return NextResponse.json(mockData);
}
